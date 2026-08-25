"use server";
import {randomBytes} from "node:crypto";
import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";
import type {SupabaseClient} from "@supabase/supabase-js";
import {requireUser} from "@/lib/auth";
import {createClient} from "@/lib/supabase/server";

const siteUrl=()=>process.env.NEXT_PUBLIC_SITE_URL??"http://localhost:3000";
const billingUrl=(message:string)=>`/dashboard/billing?message=${encodeURIComponent(message)}`;

export async function beginCheckout(form:FormData){
  const user=await requireUser();
  if(process.env.PAYMENTS_ENABLED!=="true")redirect(billingUrl("Checkout is ready but not activated. Add merchant credentials and enable payments."));
  const purpose=String(form.get("purpose"));const product=String(form.get("product"));const currency=String(form.get("currency"));
  if(!["event_plan","storage_addon"].includes(purpose)||![/^(starter|premium)$/.test(product),/^storage_(5gb|20gb)$/.test(product)].some(Boolean)||!["GHS","USD"].includes(currency))redirect(billingUrl("That purchase option is not available."));
  const provider=currency==="GHS"?"paystack":"flutterwave";
  const providerSecret=provider==="paystack"?process.env.PAYSTACK_SECRET_KEY:process.env.FLUTTERWAVE_SECRET_KEY;
  if(!providerSecret)redirect(billingUrl(`${provider==="paystack"?"Paystack":"Flutterwave"} is not configured.`));
  const supabase=await createClient();const db=supabase as unknown as SupabaseClient;
  const{data:order,error}=await db.rpc("create_payment_order",{p_purpose:purpose,p_product_code:product,p_currency:currency,p_provider:provider});
  if(error||!order?.provider_reference)redirect(billingUrl(error?.message??"The payment order could not be created."));
  const reference=String(order.provider_reference),amount=Number(order.amount);let checkoutUrl:string|undefined;
  if(provider==="paystack"){
    const response=await fetch("https://api.paystack.co/transaction/initialize",{method:"POST",headers:{Authorization:`Bearer ${providerSecret}`,"Content-Type":"application/json"},body:JSON.stringify({email:user.email,amount:Math.round(amount*100),currency:"GHS",reference,channels:["card","mobile_money"],callback_url:`${siteUrl()}/api/payments/paystack/callback`,metadata:{order_id:order.id,purpose,product}})});
    const result=await response.json() as {status?:boolean;data?:{authorization_url?:string}};checkoutUrl=result.status?result.data?.authorization_url:undefined;
  }else{
    const response=await fetch("https://api.flutterwave.com/v3/payments",{method:"POST",headers:{Authorization:`Bearer ${providerSecret}`,"Content-Type":"application/json"},body:JSON.stringify({tx_ref:reference,amount,currency:"USD",redirect_url:`${siteUrl()}/api/payments/flutterwave/callback`,payment_options:"card",customer:{email:user.email},customizations:{title:"EverAfter",description:purpose==="event_plan"?"One-time event page plan":"One-time storage upgrade"},meta:{order_id:order.id,purpose,product}})});
    const result=await response.json() as {status?:string;data?:{link?:string}};checkoutUrl=result.status==="success"?result.data?.link:undefined;
  }
  if(!checkoutUrl)redirect(billingUrl("The payment provider could not start checkout. Please try again."));
  redirect(checkoutUrl);
}

function normalizeHostname(value:string){return value.trim().toLowerCase().replace(/^https?:\/\//,"").replace(/\/.*$/,"").replace(/\.$/,"")}
export async function requestCustomDomain(form:FormData){
  const user=await requireUser();const hostname=normalizeHostname(String(form.get("hostname")??""));
  if(!/^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(hostname)||hostname.includes("everafter"))redirect(billingUrl("Enter a valid domain you own, such as celebration.com."));
  const supabase=await createClient();const db=supabase as unknown as SupabaseClient;const{data:event}=await db.from("events").select("id,plan_code").eq("owner_id",user.id).maybeSingle();
  if(!event||event.plan_code!=="premium")redirect(billingUrl("A Premium plan is required for a custom domain."));
  const token=`everafter-verification=${randomBytes(18).toString("hex")}`;const{error}=await db.from("custom_domains").upsert({event_id:event.id,hostname,status:"pending",verification_token:token,verified_at:null},{onConflict:"event_id"});
  if(error)redirect(billingUrl(error.message));revalidatePath("/dashboard/billing");redirect(billingUrl("Domain saved. Add the DNS records shown below, then verify it."));
}

export async function verifyCustomDomain(){
  const user=await requireUser();const supabase=await createClient();const db=supabase as unknown as SupabaseClient;const{data:event}=await db.from("events").select("id,plan_code").eq("owner_id",user.id).maybeSingle();
  if(!event||event.plan_code!=="premium")redirect(billingUrl("Premium access is required."));
  const{data:domain}=await db.from("custom_domains").select("*").eq("event_id",event.id).maybeSingle();if(!domain)redirect(billingUrl("Add a domain first."));
  const dns=await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(`_everafter.${domain.hostname}`)}&type=TXT`,{headers:{Accept:"application/dns-json"},cache:"no-store"});
  const result=await dns.json() as {Answer?:Array<{data:string}>};const verified=result.Answer?.some(answer=>answer.data.replace(/^"|"$/g,"")===domain.verification_token)??false;
  if(!verified)redirect(billingUrl("DNS verification was not found yet. Changes can take several hours."));
  let status="verified";const vercelToken=process.env.VERCEL_API_TOKEN,projectId=process.env.VERCEL_PROJECT_ID,teamId=process.env.VERCEL_TEAM_ID;
  if(vercelToken&&projectId){const response=await fetch(`https://api.vercel.com/v10/projects/${encodeURIComponent(projectId)}/domains${teamId?`?teamId=${encodeURIComponent(teamId)}`:""}`,{method:"POST",headers:{Authorization:`Bearer ${vercelToken}`,"Content-Type":"application/json"},body:JSON.stringify({name:domain.hostname})});if(response.ok)status="active";}
  const{error}=await db.from("custom_domains").update({status,verified_at:new Date().toISOString()}).eq("id",domain.id);if(error)redirect(billingUrl(error.message));revalidatePath("/dashboard/billing");redirect(billingUrl(status==="active"?"Your custom domain is active.":"Domain ownership verified. Hosting activation is awaiting production configuration."));
}
