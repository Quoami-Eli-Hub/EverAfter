import Link from "next/link";
import {DashboardNav} from "@/components/dashboard-nav";
import {listUserEvents} from "@/lib/event-owner";
import {selectEvent} from "./actions";

export default async function Events(){
  const{events}=await listUserEvents();
  return <div className="app-shell"><DashboardNav active="Events"/><main className="app-main">
    <div className="page-heading"><div><p className="eyebrow">Planner portfolio</p><h1>All your events</h1><p>Move between client pages without signing out or sharing passwords.</p></div><Link className="button button-coral" href="/onboarding">Create another event</Link></div>
    <div className="portfolio-summary"><div><b>{events.length}</b><span>Total workspaces</span></div><div><b>{events.filter(event=>event.status==="published").length}</b><span>Published</span></div><div><b>{events.filter(event=>event.event_type==="wedding").length}</b><span>Weddings</span></div><div><b>{events.filter(event=>event.event_type==="memorial").length}</b><span>Memorials</span></div></div>
    <div className="event-portfolio">{events.map(event=><article className={`portfolio-card portfolio-${event.event_type}`} key={event.id}><div className="portfolio-art"><span>{event.event_type==="wedding"?"WEDDING":"MEMORIAL"}</span><i>{event.title.slice(0,2).toUpperCase()}</i></div><div className="portfolio-copy"><div><span className="pill">{event.role}</span><span className={`status-dot status-${event.status}`}>{event.status}</span></div><h2>{event.title}</h2><p>{event.event_date?new Intl.DateTimeFormat("en-GB",{dateStyle:"long"}).format(new Date(`${event.event_date}T12:00:00`)):"Date to be confirmed"}</p><small>/{event.slug} · {event.visibility}</small><div className="portfolio-actions"><form action={selectEvent}><input type="hidden" name="eventId" value={event.id}/><button className="button button-dark">Manage event</button></form><Link href={`/${event.slug}`}>Preview ↗</Link></div></div></article>)}</div>
    {!events.length&&<div className="panel empty-state">No event workspaces yet. <Link href="/onboarding">Create your first event.</Link></div>}
  </main></div>;
}
