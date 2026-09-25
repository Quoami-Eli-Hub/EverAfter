import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';
import * as crypto from 'node:crypto';

function load(path,imports={},globals={}){
  const exports={};
  const source=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(source,{exports,Buffer,Response,Request,AbortSignal,URL,process:{env:{}},require:name=>{if(name in imports)return imports[name];throw new Error(name)},...globals});
  return exports;
}
const plans=load('src/lib/plans.ts');
assert.equal(plans.canUseTheme('starter',true,'romance'),false);
assert.equal(plans.canUseTheme('premium',false,'romance'),false);
assert.equal(plans.canUseTheme('premium',true,'romance'),true);
let musicRole='owner',musicPlan='premium',musicPaid=true,musicFile=true,musicWrites=0;
const musicClient={storage:{from:()=>({list:async()=>({data:musicFile?[{name:'track.mp3'}]:[],error:null})})},from:()=>({update:()=>{musicWrites++;return {eq:()=>({select:()=>({maybeSingle:async()=>({data:{id:5},error:null})})})}}})};
const music=load('src/app/dashboard/music-actions.ts',{'next/cache':{revalidatePath:()=>{}},'@/lib/event-owner':{getOwnerEvent:async()=>({supabase:musicClient,event:{id:5,slug:'test',plan_code:musicPlan,plan_paid:musicPaid},role:musicRole})}});
assert.equal((await music.saveEventMusic(6,true)).ok,false);
musicRole='viewer';assert.equal((await music.saveEventMusic(5,true)).ok,false);
musicRole='owner';musicPlan='starter';assert.equal((await music.saveEventMusic(5,true)).ok,false);
musicPlan='premium';musicPaid=false;assert.equal((await music.saveEventMusic(5,true)).ok,false);
musicPaid=true;musicFile=false;assert.equal((await music.saveEventMusic(5,true)).ok,false);
assert.equal(musicWrites,0);musicFile=true;assert.equal((await music.saveEventMusic(5,true)).ok,true);
assert.equal((await music.saveEventMusic(5,false)).ok,true);assert.equal(musicWrites,2);

assert.equal(plans.canPurchasePlan('starter',false,'starter'),true);
assert.equal(plans.canPurchasePlan('starter',true,'starter'),false);
assert.equal(plans.canPurchasePlan('starter',true,'premium'),true);
assert.equal(plans.canPurchasePlan('premium',true,'starter'),false);
assert.equal(plans.canUseTheme('premium',false,'cinematic'),false);
assert.equal(plans.canUseTheme('starter',true,'cinematic'),false);
assert.equal(plans.canUseTheme('premium',true,'cinematic'),true);
assert.equal(plans.validPurchase('storage_addon','premium'),false);

let result,activationCount=0,throwFetch=false;
const order={amount:250,currency:'GHS'};
const client={from:()=>({select(){return this},eq(){return this},async maybeSingle(){return {data:order}}}),async rpc(){activationCount++;return {data:true}}};
const payments=load('src/lib/payments.ts',{'@/lib/payment-config':{paystackMode:()=>"live"},'node:crypto':crypto,'@/lib/supabase/server':{createAdminClient:()=>client}},{process:{env:{PAYSTACK_SECRET_KEY:'sk_live_unit_test',FLUTTERWAVE_SECRET_KEY:'test'}},fetch:async()=>{if(throwFetch)throw new Error('Network');return {ok:true,json:async()=>result}}});
result={status:true,data:{domain:'live',status:'success',reference:'ref',currency:'GHS',amount:25000}};
assert.equal(await payments.verifyAndActivatePaystack('ref'),true);
for(const changed of [{domain:'test'},{amount:1},{reference:'other'},{currency:'USD'},{status:'failed'}]){
  const original=result;result={...result,data:{...result.data,...changed}};
  assert.equal(await payments.verifyAndActivatePaystack('ref'),false);result=original;
}
assert.equal(activationCount,1);
result={status:'success',data:{status:'successful',tx_ref:'ref',currency:'GHS',amount:250}};
assert.equal(await payments.verifyAndActivateFlutterwave('123','ref'),true);
result.data.tx_ref='wrong';assert.equal(await payments.verifyAndActivateFlutterwave('123','ref'),false);
throwFetch=true;assert.equal(await payments.verifyAndActivatePaystack('ref'),false);
assert.equal(await payments.verifyAndActivateFlutterwave('123','ref'),false);

let verified=true,calls=0;
const webhook=load('src/app/api/payments/flutterwave/webhook/route.ts',{'@/lib/payments':{safeEqual:payments.safeEqual,verifyAndActivateFlutterwave:async(id,ref)=>{assert.equal(id,'123');assert.equal(ref,'ref');calls++;return verified}}},{process:{env:{FLUTTERWAVE_WEBHOOK_SECRET:'test-hash'}}});
const request=(hash='test-hash')=>new Request('https://example.test/webhook',{method:'POST',headers:{'verif-hash':hash},body:JSON.stringify({event:'charge.completed',data:{id:123,tx_ref:'ref',status:'successful'}})});
assert.equal((await webhook.POST(request('wrong'))).status,401);assert.equal(calls,0);
assert.equal((await webhook.POST(request())).status,200);assert.equal(calls,1);
verified=false;assert.equal((await webhook.POST(request())).status,503);
console.log('PASS: plan eligibility, verified amounts/currencies/references, provider outages, Flutterwave v3 authentication and retry responses.');

const redirects=load("src/lib/safe-redirect.ts");
for(const path of ["//evil.test","/\\evil.test","https://evil.test",null])assert.equal(redirects.safeNextPath(path),"/dashboard");
assert.equal(redirects.safeNextPath("/reset-password"),"/reset-password");

let paystackVerified=true,paystackCalls=0;
const paystackWebhook=load('src/app/api/payments/paystack/webhook/route.ts',{'@/lib/payments':{safeEqual:payments.safeEqual,paystackSignature:payments.paystackSignature,verifyAndActivatePaystack:async(ref)=>{assert.equal(ref,'ref');paystackCalls++;return paystackVerified}}},{process:{env:{PAYSTACK_SECRET_KEY:'sk_live_unit_test'}}});
const chargeBody=JSON.stringify({event:'charge.success',data:{reference:'ref'}});
const paystackRequest=(body=chargeBody,signature=payments.paystackSignature(body,'sk_live_unit_test'))=>new Request('https://example.test/webhook',{method:'POST',headers:{'x-paystack-signature':signature},body});
assert.equal((await paystackWebhook.POST(paystackRequest(chargeBody,'wrong'))).status,401);
assert.equal(paystackCalls,0);
assert.equal((await paystackWebhook.POST(paystackRequest('{'))).status,400);
assert.equal((await paystackWebhook.POST(paystackRequest())).status,200);
assert.equal(paystackCalls,1);
paystackVerified=false;
assert.equal((await paystackWebhook.POST(paystackRequest())).status,503);
assert.equal((await paystackWebhook.POST(paystackRequest(JSON.stringify({event:'unrelated'})))).status,200);
assert.equal(paystackCalls,2);

const configEnv={PAYMENTS_ENABLED:'true',SUPABASE_SECRET_KEY:'test-server-key',PAYSTACK_SECRET_KEY:'sk_live_unit_test',VERCEL_ENV:'production'};
const config=load('src/lib/payment-config.ts',{}, {process:{env:configEnv}});
assert.equal(config.paystackReady(),true);
configEnv.PAYSTACK_SECRET_KEY='sk_test_unit_test';assert.equal(config.paystackReady(),false);
configEnv.PAYSTACK_MODE='test';assert.equal(config.paystackReady(),false);
configEnv.VERCEL_ENV='preview';assert.equal(config.paystackReady(),true);
configEnv.PAYMENTS_ENABLED='false';assert.equal(config.paystackReady(),false);
configEnv.PAYMENTS_ENABLED='true';configEnv.SUPABASE_SECRET_KEY='';assert.equal(config.paystackReady(),false);
console.log('PASS: Paystack webhook signatures, malformed payloads, retry responses, production/test isolation, and safe login redirects.');
