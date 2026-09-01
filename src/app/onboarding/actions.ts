"use server";
import { redirect } from "next/navigation";
import {cookies} from "next/headers";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {activeEventCookie} from "@/lib/event-owner";
export async function createEvent(formData: FormData) {
  await requireUser();
  const eventType=String(formData.get("eventType")??"");
  const title=String(formData.get("title")??"").trim();
  const slug=String(formData.get("slug")??"").trim().toLowerCase();
  const eventDate=String(formData.get("eventDate")??"")||undefined;
  if(!["wedding","memorial"].includes(eventType)||title.length<3||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) redirect("/onboarding?message=Please+complete+all+fields+and+use+a+simple+link");
  const supabase=await createClient();
  const {data:eventId,error}=await supabase.rpc("create_event",{p_event_type:eventType,p_title:title,p_slug:slug,p_event_date:eventDate});
  if(error){const message=error.code==="23505"?"That+page+link+is+already+taken":"We+couldn’t+create+this+event+right+now.+Please+try+again";redirect(`/onboarding?message=${message}`)}
  (await cookies()).set(activeEventCookie,String(eventId),{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:60*60*24*365});
  redirect("/dashboard");
}
