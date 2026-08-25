import { DashboardNav } from "@/components/dashboard-nav";
import { getOwnerEvent } from "@/lib/event-owner";
import { clearEventPassword, setEventPassword, updateEvent } from "../actions";
import {AppearancePicker} from "@/components/appearance-picker";
import "./appearance.css";

export default async function Settings({searchParams}:{searchParams:Promise<{password?:string;message?:string}>}) {
  const { event } = await getOwnerEvent();
  const query = await searchParams;
  return <div className="app-shell"><DashboardNav active="Settings"/><main className="app-main">
    <div className="page-heading"><div><p className="eyebrow">Publishing, design & privacy</p><h1>Event settings</h1><p>Public pages can be indexed. Protected and private pages are excluded.</p></div></div>
    {query.message&&<div className={query.message==="saved"?"rsvp-success":"auth-message"}>{query.message==="saved"?"Settings saved. Your selected appearance is now live.":query.message}</div>}
    <div className="settings-layout">
    <form action={updateEvent} className="settings-workspace">
      <AppearancePicker eventType={event.event_type==="memorial"?"memorial":"wedding"} initialTheme={event.theme_key} initialColor={event.color_key} initialFont={event.font_key} premium={event.plan_code==="premium"}/>
      <div className="panel settings-form">
        <label>Page title<input name="title" maxLength={120} defaultValue={event.title} required/></label>
        <label>Event date<input name="eventDate" type="date" defaultValue={event.event_date??""}/></label>
        <label>Short introduction<textarea name="excerpt" maxLength={500} defaultValue={event.excerpt??""}/></label>
        <div className="grid-2"><label>Page status<select name="status" defaultValue={event.status}><option value="draft">Draft</option><option value="published">Published</option><option value="unpublished">Unpublished</option></select></label><label>Privacy<select name="visibility" defaultValue={event.visibility}><option value="public">Public and searchable</option><option value="protected">Password protected</option><option value="private">Private</option></select></label></div>
        <div className="grid-2"><label>RSVP deadline<input name="rsvpDeadline" type="datetime-local" defaultValue={event.rsvp_deadline?.slice(0,16)??""}/></label><label>Maximum party size<input name="maxPartySize" type="number" min="1" max="20" defaultValue={event.max_party_size}/></label></div>
        <label className="check-row"><input type="checkbox" name="rsvpEnabled" defaultChecked={event.rsvp_enabled}/> Accept guest RSVPs</label>
        <label className="check-row"><input type="checkbox" name="allowDownloads" defaultChecked={event.allow_photo_downloads}/> Allow permitted gallery downloads</label>
        <button className="button button-coral">Save and apply settings</button>
      </div>
    </form>
      <aside className="panel password-panel"><p className="eyebrow">Protected access</p><h2>Event password</h2><p>Set a password before selecting Password protected. Guests receive a secure 24-hour access token after unlocking the page.</p>{query.password&&<div className={query.password==="saved"||query.password==="cleared"?"rsvp-success":"auth-message"}>{query.password==="saved"?"Password saved.":query.password==="cleared"?"Password removed and page made private.":"Passwords must match and contain 8–128 characters."}</div>}<form action={setEventPassword} className="manage-form"><input name="password" type="password" minLength={8} maxLength={128} required placeholder="New event password" autoComplete="new-password"/><input name="confirm" type="password" minLength={8} maxLength={128} required placeholder="Confirm password" autoComplete="new-password"/><button className="button button-dark">Set event password</button></form><form action={clearEventPassword}><button className="text-danger">Remove password and make private</button></form></aside>
    </div>
  </main></div>;
}
