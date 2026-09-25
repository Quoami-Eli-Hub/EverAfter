import {paystackReady} from "@/lib/payment-config";
import {SubmitButton} from "@/components/submit-button";
import Link from "next/link";
import {DashboardNav} from "@/components/dashboard-nav";
import {getOwnerEvent} from "@/lib/event-owner";
import {planCode,planExperience,canPurchasePlan} from "@/lib/plans";
import {beginCheckout,requestCustomDomain,verifyCustomDomain} from "./actions";
import "./billing.css";

export default async function BillingPage({searchParams}:{searchParams:Promise<{message?:string;payment?:string}>}){
  const{event,role,db}=await getOwnerEvent();const query=await searchParams;
  const[{data:plans,error:planError},{data:addons},{data:orders},{data:domain}]=await Promise.all([
    db.from("event_plans").select("*").eq("active",true).order("price_ghs"),
    db.from("storage_addons").select("*").eq("active",true).order("price_ghs"),
    db.from("payment_orders").select("*").eq("event_id",event.id).order("created_at",{ascending:false}).limit(8),
    db.from("custom_domains").select("*").eq("event_id",event.id).maybeSingle()
  ]);
  const owner=role==="owner",paid=event.plan_paid===true;
  const readyGhs=paystackReady();
  const readyUsd=process.env.PAYMENTS_ENABLED==="true"&&Boolean(process.env.FLUTTERWAVE_SECRET_KEY)&&Boolean(process.env.SUPABASE_SECRET_KEY);
  const current=planExperience[planCode(event.plan_code)];
  function checkout(purpose:string,product:string){return <div className="checkout-row">{[["GHS",readyGhs,"Card / Mobile Money"],["USD",readyUsd,"Card"]].map(([currency,ready,label])=><form action={beginCheckout} key={String(currency)}><input type="hidden" name="eventId" value={event.id}/><input type="hidden" name="purpose" value={purpose}/><input type="hidden" name="product" value={product}/><input type="hidden" name="currency" value={String(currency)}/><SubmitButton disabled={!owner||!ready} pendingLabel="Opening checkout…">{ready?String(currency)+" · "+label:String(currency)+" unavailable"}</SubmitButton></form>)}</div>}
  return <div className="app-shell"><DashboardNav active="Plan"/><main className="app-main billing-page">
    <div className="page-heading"><div><p className="eyebrow">Your event, your plan</p><h1>{paid?current.name+" publishing":"Create freely. Publish when ready."}</h1><p>One payment per event. No subscription or renewal fee.</p></div><span className="plan-badge">{paid?current.name:"Free draft"}</span></div>
    {query.message&&<div className="auth-message" role="alert">{query.message}</div>}
    {query.payment&&<div className={paid&&query.payment==="success"?"rsvp-success":"feedback-info"} role="status">{query.payment==="success"?(paid?"Payment verified. Your plan is active. You can now publish from the overview.":"Check your payment history below for the latest status."):"Payment was not completed or could not yet be verified. Your draft is safe."}</div>}
    {!owner&&<p className="billing-notice">Only the event owner can purchase a plan or manage a domain.</p>}
    {!readyGhs&&!readyUsd&&<p className="billing-notice">Online checkout is currently unavailable. You can continue creating and previewing your event.</p>}
    {!paid&&<div className="draft-guide"><b>Your free workspace</b><p>Write your story, personalise the invitation, add photos and preview the page. Choose a plan below when you are ready to share it with guests.</p><Link href="/dashboard/editor">Continue editing →</Link></div>}
    <p className="billing-notice">Payments are processed securely by the provider. Refund requests are reviewed individually: <a href="mailto:dehuminals@gmail.com">dehuminals@gmail.com</a>. Read our <Link href="/terms">payment terms</Link>.</p>
    <section className="billing-section"><div className="billing-heading"><p className="eyebrow">Two ways to make it yours</p><h2>Choose your experience</h2><p>Every plan includes the invitation card, RSVP management, message moderation, programme, team collaboration and privacy controls.</p></div>
      {planError&&<p role="alert">Plans could not be loaded. Please refresh and try again.</p>}
      <div className="plan-grid">{(plans??[]).map(plan=>{const experience=planExperience[planCode(plan.code)],active=paid&&plan.code===event.plan_code;return <article className={"plan-card plan-style-"+plan.code+(active?" current":"")} key={plan.code}>
        <span>{active?"Your active plan":plan.code==="premium"?"A more personal presentation":"Simple and beautifully organised"}</span><h3>{plan.name}</h3><p className="plan-tagline">{experience.tagline}</p>
        <div className="price-switch"><b>GH₵ {Number(plan.price_ghs).toFixed(0)}</b><small>or US$ {Number(plan.price_usd).toFixed(0)}</small></div><p>One-time price for this event.</p>
        <ul><li>{Number(plan.storage_bytes)/1073741824} GB included storage</li><li>{experience.templates.length} layouts: {experience.templates.map(t=>t.charAt(0).toUpperCase()+t.slice(1)).join(", ")}</li><li>{plan.branding_removed?"No EverAfter branding":"EverAfter footer branding"}</li><li>{plan.custom_domain_enabled?"Connect a domain you own (domain purchase separate)":"Your own EverAfter event link"}</li><li>{plan.code==="premium"?"Romance template, optional MP3 music, gallery and domain workflow":"Guided details, design and publishing workflow"}</li></ul>
        {active?<p className="plan-active">✓ Active for this event</p>:canPurchasePlan(event.plan_code,paid,plan.code)?checkout("event_plan",plan.code):<p>Included in your Premium plan.</p>}
      </article>})}</div><p className="billing-fineprint">Premium upgrades use the displayed one-time Premium price. Existing content and purchased extra storage are retained.</p>
    </section>
    <section className="billing-section storage-section"><div><p className="eyebrow">Room for more memories</p><h2>Extra gallery space</h2><p>{(Number(event.storage_used_bytes)/1073741824).toFixed(2)} GB of {(Number(event.storage_limit_bytes)/1073741824).toFixed(0)} GB used</p><progress className="storage-meter" value={Number(event.storage_used_bytes)} max={Number(event.storage_limit_bytes)} aria-label="Storage used"/></div><div className="addon-grid">{(addons??[]).map(addon=><article key={addon.code}><h3>{addon.name}</h3><p>GH₵ {Number(addon.price_ghs).toFixed(0)} · US$ {Number(addon.price_usd).toFixed(0)}</p>{paid?checkout("storage_addon",addon.code):<p>Available after you activate a plan.</p>}</article>)}</div></section>
    <section id="domain" className="billing-section domain-section"><div><p className="eyebrow">Premium · your own address</p><h2>A home with your name on it.</h2><p>Connect a domain you own. Your event content and guest list stay together.</p></div>{paid&&event.plan_code==="premium"?<div className="domain-card"><form action={requestCustomDomain}><label>Domain name<input name="hostname" placeholder="ourcelebration.com" defaultValue={domain?.hostname??""} required disabled={!owner}/></label><button className="button button-dark" disabled={!owner}>Save domain</button></form>{domain&&<div className="dns-records"><span className="domain-status">{domain.status}</span><p>Add the ownership record below, then check verification. Hosting activation must also finish before this address can serve your page.</p><code>TXT _everafter → {domain.verification_token}</code><p>Point your domain to the hosting record supplied for this project by Vercel.</p><form action={verifyCustomDomain}><button className="button panel-button" disabled={!owner}>Check verification</button></form></div>}</div>:<div className="locked-card"><b>Included with Premium</b><p>Connect your address after activating Premium.</p></div>}</section>
    {!!orders?.length&&<section className="billing-section"><h2>This event’s payment history</h2><div className="order-list">{orders.map(order=><article key={order.id}><span>{new Intl.DateTimeFormat("en-GB",{dateStyle:"medium"}).format(new Date(order.created_at))}</span><b>{order.metadata?.product_code??String(order.purpose).replaceAll("_"," ")}</b><span>{order.currency} {Number(order.amount).toFixed(2)}</span><em className={"order-"+order.status}>{order.status}</em></article>)}</div></section>}
  </main></div>;
}
