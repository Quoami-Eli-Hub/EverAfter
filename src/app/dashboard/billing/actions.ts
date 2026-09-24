"use server";
import {randomBytes} from "node:crypto";
import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";
import type {SupabaseClient} from "@supabase/supabase-js";
import {requireUser} from "@/lib/auth";
import {canPurchasePlan,validPurchase} from "@/lib/plans";
import {createClient,createAdminClient} from "@/lib/supabase/server";
import {getOwnerEvent} from "@/lib/event-owner";

const siteUrl=()=>process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/,"")??(process.env.VERCEL_PROJECT_PRODUCTION_URL?"https://"+process.env.VERCEL_PROJECT_PRODUCTION_URL:"http://localhost:3000");
const billingUrl=(message:string)=>`/dashboard/billing?message=${encodeURIComponent(message)}`;

export async function beginCheckout(form:FormData){
  const user=await requireUser();
  const{event,role}=await getOwnerEvent();if(role!=="owner")redirect(billingUrl("Only the event owner can start a payment."));
  if(process.env.PAYMENTS_ENABLED!=="true"||!process.env.SUPABASE_SECRET_KEY)redirect(billingUrl("Online checkout is currently unavailable. Your draft is safe; please try again later."));
  const purpose=String(form.get("purpose"));const product=String(form.get("product"));const currency=String(form.get("currency"));
  if(!validPurchase(purpose,product)||!["GHS","USD"].includes(currency))redirect(billingUrl("That purchase option is not available."));
  if(Number(form.get("eventId"))!==event.id)redirect(billingUrl("Your active event changed. Refresh before purchasing."));
  if(purpose==="event_plan"&&!canPurchasePlan(event.plan_code,event.plan_paid,product))redirect(billingUrl("This plan is already active. Downgrades are not available."));
  if(purpose==="storage_addon"&&!event.plan_paid)redirect(billingUrl("Choose a publishing plan before adding storage."));
  const provider=currency==="GHS"?"paystack":"flutterwave";
  const providerSecret=provider==="paystack"?process.env.PAYSTACK_SECRET_KEY:process.env.FLUTTERWAVE_SECRET_KEY;
  if(!providerSecret)redirect(billingUrl(`${provider==="paystack"?"Paystack":"Flutterwave"} checkout is currently unavailable.`));
  const supabase=await createClient();const db=supabase as unknown as SupabaseClient;
  const{data:order,error}=await db.rpc("create_payment_order",{p_event_id:event.id,p_purpose:purpose,p_product_code:product,p_currency:currency,p_provider:provider});
  if(error||!order?.provider_reference)redirect(billingUrl("We couldn’t prepare your payment. Please try again in a moment."));
  const reference=String(order.provider_reference),amount=Number(order.amount);let checkoutUrl:string|undefined;
  try{
  if(provider==="paystack"){
    const response=await fetch("https://api.paystack.co/transaction/initialize",{method:"POST",headers:{Authorization:`Bearer ${providerSecret}`,"Content-Type":"application/json"},body:JSON.stringify({email:user.email,amount:Math.round(amount*100),currency:"GHS",reference,channels:["card","mobile_money"],callback_url:`${siteUrl()}/api/payments/paystack/callback`,metadata:{order_id:order.id,purpose,product}})});
    const result=await response.json() as {status?:boolean;data?:{authorization_url?:string}};checkoutUrl=result.status?result.data?.authorization_url:undefined;
  }else{
    const response=await fetch("https://api.flutterwave.com/v3/payments",{method:"POST",headers:{Authorization:`Bearer ${providerSecret}`,"Content-Type":"application/json"},body:JSON.stringify({tx_ref:reference,amount,currency:"USD",redirect_url:`${siteUrl()}/api/payments/flutterwave/callback`,payment_options:"card",customer:{email:user.email},customizations:{title:"EverAfter",description:purpose==="event_plan"?"One-time event page plan":"One-time storage upgrade"},meta:{order_id:order.id,purpose,product}})});
    const result=await response.json() as {status?:string;data?:{link?:string}};checkoutUrl=result.status==="success"?result.data?.link:undefined;
  }
  }catch{checkoutUrl=undefined;}
  if(!checkoutUrl){await createAdminClient().rpc("fail_payment_order",{p_reference:reference});}
  if(!checkoutUrl)redirect(billingUrl("The payment provider could not start checkout. Please try again."));
  redirect(checkoutUrl);
}

function normalizeHostname(value:string){return value.trim().toLowerCase().replace(/^https?:\/\//,"").replace(/\/.*$/,"").replace(/\.$/,"")}
export async function requestCustomDomain(form:FormData){
  await requireUser();const hostname=normalizeHostname(String(form.get("hostname")??""));
  if(!/^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(hostname)||hostname.includes("everafter"))redirect(billingUrl("Enter a valid domain you own, such as celebration.com."));
  const{event,role}=await getOwnerEvent();if(role!=="owner")redirect(billingUrl("Only the event owner can manage billing and domains."));
  if(!event||(event.plan_code!=="premium"||!event.plan_paid))redirect(billingUrl("A Premium plan is required for a custom domain."));
  if(!process.env.SUPABASE_SECRET_KEY)redirect(billingUrl("Domain setup is currently unavailable."));
  const token=`everafter-verification=${randomBytes(18).toString("hex")}`;const{error}=await createAdminClient().from("custom_domains").upsert({event_id:event.id,hostname,status:"pending",verification_token:token,verified_at:null},{onConflict:"event_id"});
  if(error)redirect(billingUrl("We couldn’t save this domain. Check that it is not already connected to another event, then try again."));revalidatePath("/dashboard/billing");redirect(billingUrl("Domain saved. Add the DNS records shown below, then verify it."));
}

export async function verifyCustomDomain(){
  await requireUser();const{db,event,role}=await getOwnerEvent();if(role!=="owner")redirect(billingUrl("Only the event owner can manage billing and domains."));
  if(!event||event.plan_code!=="premium"||!event.plan_paid)redirect(billingUrl("Premium access is required."));
  const{data:domain}=await db.from("custom_domains").select("*").eq("event_id",event.id).maybeSingle();if(!domain)redirect(billingUrl("Add a domain first."));
  if(!process.env.SUPABASE_SECRET_KEY)redirect(billingUrl("Domain verification is currently unavailable."));
  const dns=await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(`_everafter.${domain.hostname}`)}&type=TXT`,{headers:{Accept:"application/dns-json"},cache:"no-store",signal:AbortSignal.timeout(10000)}).catch(()=>null);
  if(!dns?.ok)redirect(billingUrl("DNS verification is temporarily unavailable. Please try again."));
  const result=await dns.json() as {Answer?:Array<{data:string}>};const verified=result.Answer?.some(answer=>answer.data.replace(/^"|"$/g,"")===domain.verification_token)??false;
  if(!verified)redirect(billingUrl("DNS verification was not found yet. Changes can take several hours."));
  let status="verified";const vercelToken=process.env.VERCEL_API_TOKEN,projectId=process.env.VERCEL_PROJECT_ID,teamId=process.env.VERCEL_TEAM_ID;
  if(vercelToken&&projectId){try{let response=await fetch(`https://api.vercel.com/v10/projects/${encodeURIComponent(projectId)}/domains${teamId?`?teamId=${encodeURIComponent(teamId)}`:""}`,{method:"POST",headers:{Authorization:`Bearer ${vercelToken}`,"Content-Type":"application/json"},body:JSON.stringify({name:domain.hostname}),signal:AbortSignal.timeout(10000)});if(response.status===409){response=await fetch(`https://api.vercel.com/v9/projects/${encodeURIComponent(projectId)}/domains/${encodeURIComponent(domain.hostname)}${teamId?`?teamId=${encodeURIComponent(teamId)}`:""}`,{headers:{Authorization:`Bearer ${vercelToken}`},cache:"no-store",signal:AbortSignal.timeout(10000)});}if(response.ok){const added=await response.json() as {verified?:boolean};const config=await fetch(`https://api.vercel.com/v6/domains/${encodeURIComponent(domain.hostname)}/config${teamId?`?teamId=${encodeURIComponent(teamId)}`:""}`,{headers:{Authorization:`Bearer ${vercelToken}`},cache:"no-store",signal:AbortSignal.timeout(10000)}).catch(()=>null);if(added.verified===true&&config?.ok){const value=await config.json() as {misconfigured?:boolean};if(value.misconfigured===false)status="active";}}}catch{/* Keep ownership verified until hosting checks succeed. */}}
  const{error}=await createAdminClient().from("custom_domains").update({status,verified_at:new Date().toISOString()}).eq("id",domain.id).eq("event_id",event.id).eq("hostname",domain.hostname).eq("verification_token",domain.verification_token).select("id").single();if(error)redirect(billingUrl("Your domain was verified, but we couldn’t save its status. Please try again."));revalidatePath("/dashboard/billing");redirect(billingUrl(status==="active"?"Your custom domain is active.":"Domain ownership verified. Hosting activation is awaiting production configuration."));
}
