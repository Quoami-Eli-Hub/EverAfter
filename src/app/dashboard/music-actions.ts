"use server";

import {revalidatePath} from "next/cache";
import {getOwnerEvent} from "@/lib/event-owner";

export async function saveEventMusic(eventId:number,enabled:boolean){
  const {supabase,event,role}=await getOwnerEvent();
  if(event.id!==eventId||!["owner","planner"].includes(role))return {ok:false,message:"Refresh this page and check that you can edit this event."};
  if(enabled&&(event.plan_code!=="premium"||event.plan_paid!==true))return {ok:false,message:"Music requires a paid Premium plan."};
  const path=`${event.id}/track.mp3`;
  if(enabled){
    const {data,error}=await supabase.storage.from("event-music").list(String(event.id),{search:"track.mp3",limit:2});
    if(error||!data?.some(file=>file.name==="track.mp3"))return {ok:false,message:"Upload an MP3 before saving your music."};
  }
  const {data,error}=await supabase.from("events").update({music_path:enabled?path:null}).eq("id",event.id).select("id").maybeSingle();
  if(error||!data)return {ok:false,message:"Music settings couldn’t be saved. Please try again."};
  revalidatePath("/dashboard/settings");
  revalidatePath(`/${event.slug}`);
  return {ok:true,message:enabled?"Music saved. Guests can press Play music on your event page.":"Music removed from your event page."};
}
