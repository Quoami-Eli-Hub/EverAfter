"use server";
import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import {activeEventCookie,listUserEvents} from "@/lib/event-owner";

export async function selectEvent(form:FormData){
  const eventId=Number(form.get("eventId"));
  const{events}=await listUserEvents();
  if(!events.some(event=>event.id===eventId))redirect("/dashboard/events?message=Event+access+was+not+found");
  (await cookies()).set(activeEventCookie,String(eventId),{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:60*60*24*365});
  redirect("/dashboard");
}
