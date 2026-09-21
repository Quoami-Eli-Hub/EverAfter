export function DashboardFeedback({message}:{message?:string}){
  if(!message)return null;
  const success=message==="saved";
  return <div className={success?"rsvp-success":"auth-message"} role={success?"status":"alert"}>{success?"Your changes have been saved.":message}</div>;
}
