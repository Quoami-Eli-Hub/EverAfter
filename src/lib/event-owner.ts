import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import type {SupabaseClient} from "@supabase/supabase-js";
import {requireUser} from "@/lib/auth";
import {createClient} from "@/lib/supabase/server";

export const activeEventCookie="everafter-active-event";

export async function listUserEvents(){
  const user=await requireUser();
  const supabase=await createClient();
  const db=supabase as unknown as SupabaseClient;
  const{data:memberships,error}=await db.from("event_memberships").select("event_id,role").eq("user_id",user.id).not("accepted_at","is",null);
  if(error)throw new Error(error.message);
  const roleByEvent=new Map<number,string>((memberships??[]).map(item=>[Number(item.event_id),String(item.role)]));
  const ids=[...roleByEvent.keys()];
  if(!ids.length)return{supabase,db,user,events:[] as Array<Record<string,unknown>&{id:number;role:string}>};
  const{data:events,error:eventError}=await db.from("events").select("*").in("id",ids).order("event_date",{ascending:true,nullsFirst:false});
  if(eventError)throw new Error(eventError.message);
  return{supabase,db,user,events:(events??[]).map(event=>({...event,role:roleByEvent.get(Number(event.id))??"viewer"}))};
}

export async function getOwnerEvent(){
  const workspace=await listUserEvents();
  if(!workspace.events.length)redirect("/onboarding");
  const requested=Number((await cookies()).get(activeEventCookie)?.value);
  const event=workspace.events.find(item=>item.id===requested)??workspace.events[0];
  return{...workspace,event,role:event.role};
}
