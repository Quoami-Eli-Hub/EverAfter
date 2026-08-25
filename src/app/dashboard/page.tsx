import Link from "next/link";
import {redirect} from "next/navigation";
import {DashboardNav} from "@/components/dashboard-nav";
import {CopyLinkButton} from "@/components/copy-link-button";
import {requireUser} from "@/lib/auth";
import {createClient} from "@/lib/supabase/server";
import {setPublicationStatus} from "./actions";

export default async function Dashboard(){
  const user=await requireUser();const supabase=await createClient();
  const{data:event}=await supabase.from("events").select("*").eq("owner_id",user.id).maybeSingle();if(!event)redirect("/onboarding");
  const[{data:sections},{count:rsvpCount},{count:photoCount}]=await Promise.all([supabase.from("event_sections").select("id,section_key,is_visible").eq("event_id",event.id).order("sort_order"),supabase.from("rsvps").select("id",{count:"exact",head:true}).eq("event_id",event.id),supabase.from("media").select("id",{count:"exact",head:true}).eq("event_id",event.id)]);
  const completion=Math.min(100,20+Math.round(((sections?.filter(s=>s.is_visible).length??0)/Math.max(sections?.length??1,1))*55)+(event.event_date?10:0)+(photoCount?15:0));const publicHref=`/${event.slug}`;
  return <div className="app-shell"><DashboardNav active="Overview"/><main className="app-main">
    <div className="page-heading"><div><p className="eyebrow">Owner workspace</p><h1>{event.title}</h1><p>{event.event_type==="wedding"?"Wedding":"Memorial"} · {event.event_date??"Date not set"}</p></div><div className="button-row"><Link href={publicHref} className="button panel-button">Preview page ↗</Link><form action={setPublicationStatus}><button className="button button-dark" name="publish" value={event.status==="published"?"false":"true"}>{event.status==="published"?"Unpublish":"Publish page"}</button></form></div></div>
    <div className="setup-card"><div><span className="pill">Setup · {completion}% complete</span><h2>Your page is taking shape.</h2><p>Complete the content, schedule, privacy and gallery before sharing.</p></div><div className="ring">{completion}<small>%</small></div></div>
    <div className="stat-grid"><article className="panel stat"><span>RSVP responses</span><strong>{rsvpCount??0}</strong><Link href="/dashboard/guests">Manage guests →</Link></article><article className="panel stat"><span>Page status</span><strong>{event.status}</strong><small>{event.visibility} visibility</small></article><article className="panel stat"><span>Storage used</span><strong>{(event.storage_used_bytes/1048576).toFixed(1)} <small>MB</small></strong><small>{photoCount??0} photos</small></article></div>
    <div className="grid-2 manage-grid"><section className="panel"><h2>Your event link</h2><div className="copy-link"><span>/{event.slug}</span><CopyLinkButton path={publicHref}/></div><Link className="button button-dark full" href={publicHref}>Preview experience ↗</Link></section><section className="panel action-list"><h3>Finish your page</h3><Link href="/dashboard/editor"><b>01</b><span>Write your content<small>Edit every page section</small></span>→</Link><Link href="/dashboard/schedule"><b>02</b><span>Add event logistics<small>Venues and programme</small></span>→</Link><Link href="/dashboard/settings"><b>03</b><span>Publish and share<small>Privacy and RSVP controls</small></span>→</Link></section></div>
  </main></div>;
}
