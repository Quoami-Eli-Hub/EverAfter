import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';

const source=ts.transpileModule(readFileSync('src/app/[slug]/actions.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
async function run(action,fields,event,insertError=null){
  const inserts=[],refreshes=[];
  const client={from:table=>({select(){return this},eq(){return this},async maybeSingle(){return {data:event}},async insert(value){inserts.push({table,value});return {error:insertError}}})};
  const exports={};
  vm.runInNewContext(source,{exports,console:{error(){}},require:name=>{
    if(name==='next/navigation')return {redirect:url=>{throw Object.assign(new Error('redirect'),{url})}};
    if(name==='next/cache')return {revalidatePath:path=>refreshes.push(path)};
    if(name==='next/headers')return {cookies:async()=>({get:()=>undefined})};
    if(name==='@/lib/event-access')return {eventAccessCookie:slug=>slug};
    if(name==='@/lib/supabase/server')return {createClient:async()=>client,createEventAccessClient:async()=>client};
    throw new Error(name);
  }});
  const form=new FormData();for(const [key,value] of Object.entries(fields))form.set(key,String(value));
  try{await exports[action](form);throw new Error('Expected redirect')}catch(error){if(!error.url)throw error;return {url:error.url,inserts,refreshes}}
}
const event={id:5,status:'published',visibility:'public',event_type:'wedding',rsvp_enabled:true,rsvp_deadline:null,max_party_size:5};
const rsvp={slug:'test-event',guestName:'Test Guest',phone:'+233 240000000',attending:'true',partySize:2,note:'Vegetarian meal'};
const message={slug:'test-event',authorName:'Test Guest',message:'Congratulations to you both!'};
(async()=>{
  let result=await run('submitRsvp',rsvp,event);
  assert.equal(result.url,'/test-event?rsvp=success#rsvp');
  assert.equal(result.inserts[0].value.note,'Vegetarian meal');
  assert.ok(result.refreshes.includes('/dashboard/guests'));
  result=await run('submitRsvp',{...rsvp,attending:'false'},event);
  assert.equal(result.inserts[0].value.party_size,1);
  for(const changed of [{status:'draft'},{visibility:'private'},{rsvp_enabled:false},{rsvp_deadline:'2000-01-01'},{max_party_size:1}]){
    result=await run('submitRsvp',rsvp,{...event,...changed});assert.equal(result.inserts.length,0);assert.doesNotMatch(result.url,/success/);
  }
  result=await run('submitRsvp',{...rsvp,attending:'unexpected'},event);assert.match(result.url,/invalid/);assert.equal(result.inserts.length,0);
  result=await run('submitTribute',message,event);assert.equal(result.url,'/test-event?tribute=success#messages');assert.equal(result.inserts[0].value.status,'pending');assert.ok(result.refreshes.includes('/dashboard/tributes'));
  for(const changed of [{status:'draft'},{visibility:'private'}]){
    result=await run('submitTribute',message,{...event,...changed});assert.match(result.url,/unavailable/);assert.equal(result.inserts.length,0);
  }
  result=await run('submitTribute',{...message,message:'short'},event);assert.match(result.url,/invalid/);assert.equal(result.inserts.length,0);
  result=await run('submitTribute',message,event,{code:'42501'});assert.equal(result.url,'/test-event?tribute=error#messages');assert.equal(result.refreshes.length,0);
  result=await run('submitRsvp',rsvp,event,{code:'42501'});assert.match(result.url,/rsvp=error/);assert.equal(result.refreshes.length,0);
  result=await run('submitTribute',{...message,slug:'//outside.example'},event);assert.equal(result.url,'/');assert.equal(result.inserts.length,0);
  console.log('PASS: guest submissions, routing, moderation defaults, validation, closed/private events, and database failure handling.');
})().catch(error=>{console.error(error);process.exitCode=1});
