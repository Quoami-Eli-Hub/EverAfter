import {createHmac,timingSafeEqual} from "node:crypto";
import {createAdminClient} from "@/lib/supabase/server";

type Order={amount:number;currency:string;provider_reference:string|null;provider:string|null};
type PaystackVerification={status:boolean;data?:{status:string;amount:number;currency:string;reference:string}};
type FlutterwaveVerification={status:string;data?:{status:string;amount:number;currency:string;tx_ref:string}};

export function safeEqual(expected:string,received:string){const a=Buffer.from(expected),b=Buffer.from(received);return a.length===b.length&&timingSafeEqual(a,b)}
export function paystackSignature(body:string,secret:string){return createHmac("sha512",secret).update(body).digest("hex")}
export function flutterwaveSignature(body:string,secret:string){return createHmac("sha256",secret).update(body).digest("base64")}

export async function verifyAndActivatePaystack(reference:string){
  const secret=process.env.PAYSTACK_SECRET_KEY;if(!secret)return false;
  const admin=createAdminClient();const{data:order}=await admin.from("payment_orders").select("amount,currency,provider_reference,provider").eq("provider_reference",reference).eq("provider","paystack").maybeSingle() as {data:Order|null};
  if(!order)return false;
  const response=await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,{headers:{Authorization:`Bearer ${secret}`},cache:"no-store"});
  if(!response.ok)return false;const result=await response.json() as PaystackVerification;
  if(!result.status||result.data?.status!=="success"||result.data.reference!==reference||result.data.currency!==order.currency||result.data.amount!==Math.round(order.amount*100))return false;
  const{data}=await admin.rpc("activate_payment_order",{p_reference:reference,p_amount:order.amount,p_currency:order.currency});return data===true;
}

export async function verifyAndActivateFlutterwave(transactionId:string,reference:string){
  const secret=process.env.FLUTTERWAVE_SECRET_KEY;if(!secret)return false;
  const admin=createAdminClient();const{data:order}=await admin.from("payment_orders").select("amount,currency,provider_reference,provider").eq("provider_reference",reference).eq("provider","flutterwave").maybeSingle() as {data:Order|null};
  if(!order)return false;
  const response=await fetch(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transactionId)}/verify`,{headers:{Authorization:`Bearer ${secret}`},cache:"no-store"});
  if(!response.ok)return false;const result=await response.json() as FlutterwaveVerification;
  if(result.status!=="success"||result.data?.status!=="successful"||result.data.tx_ref!==reference||result.data.currency!==order.currency||Number(result.data.amount)!==Number(order.amount))return false;
  const{data}=await admin.rpc("activate_payment_order",{p_reference:reference,p_amount:order.amount,p_currency:order.currency});return data===true;
}
