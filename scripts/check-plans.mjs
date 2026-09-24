import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';
import * as crypto from 'node:crypto';

function load(path,imports={},globals={}){
  const exports={};
  const source=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(source,{exports,Buffer,Response,Request,process:{env:{}},require:name=>{if(name in imports)return imports[name];throw new Error(name)},...globals});
  return exports;
}
const plans=load('src/lib/plans.ts');
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
const payments=load('src/lib/payments.ts',{'node:crypto':crypto,'@/lib/supabase/server':{createAdminClient:()=>client}},{process:{env:{PAYSTACK_SECRET_KEY:'test',FLUTTERWAVE_SECRET_KEY:'test'}},fetch:async()=>{if(throwFetch)throw new Error('Network');return {ok:true,json:async()=>result}}});
result={status:true,data:{status:'success',reference:'ref',currency:'GHS',amount:25000}};
assert.equal(await payments.verifyAndActivatePaystack('ref'),true);
for(const changed of [{amount:1},{reference:'other'},{currency:'USD'},{status:'failed'}]){
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
