import {DashboardNav} from "@/components/dashboard-nav";
import {getOwnerEvent} from "@/lib/event-owner";
import {addCollaborator,removeCollaborator} from "./actions";

export default async function Team({searchParams}:{searchParams:Promise<{message?:string}>}){
  const{db,event,role}=await getOwnerEvent();const{message}=await searchParams;
  const{data:memberships}=await db.from("event_memberships").select("user_id,role,created_at,profiles(display_name)").eq("event_id",event.id).order("created_at");
  return <div className="app-shell"><DashboardNav active="Team"/><main className="app-main">
    <div className="page-heading"><div><p className="eyebrow">Secure collaboration</p><h1>{event.title} team</h1><p>Everyone signs in with their own account. No shared passwords are needed.</p></div><span className="pill">Your role · {role}</span></div>
    {message&&<div className={message==="added"||message==="removed"?"rsvp-success":"auth-message"}>{message==="added"?"Collaborator added.":message==="removed"?"Collaborator removed.":message}</div>}
    <div className="grid-2 manage-grid"><section className="panel"><h2>Add an existing EverAfter user</h2><p className="muted">The collaborator must create an account first. Adding them never reveals or changes their password.</p>{role==="owner"?<form action={addCollaborator} className="manage-form"><input name="email" type="email" required placeholder="planner@example.com"/><select name="role" defaultValue="planner"><option value="planner">Planner · manage page and guests</option><option value="contributor">Contributor · edit content and media</option><option value="viewer">Viewer · review only</option></select><button className="button button-dark">Add collaborator</button></form>:<p className="security-note">Only the event owner can change team access.</p>}</section>
      <section className="panel"><h2>Current access</h2>{memberships?.map(member=>{const profile=Array.isArray(member.profiles)?member.profiles[0]:member.profiles;return <article className="manage-row" key={member.user_id}><div><b>{profile?.display_name||"EverAfter user"}</b><small>{member.role}</small></div>{role==="owner"&&member.role!=="owner"&&<form action={removeCollaborator}><input type="hidden" name="userId" value={member.user_id}/><button>Remove</button></form>}</article>})}</section></div>
  </main></div>;
}
