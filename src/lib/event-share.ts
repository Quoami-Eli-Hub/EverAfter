import {createClient} from "@supabase/supabase-js";
import type {Database} from "@/lib/database.types";
import {invitationDate,invitationSettings} from "@/lib/invitation";

// Sharing must never inherit an owner's session or a guest's access cookie.
export async function getEventShare(slug:string){
  const db=createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
  const{data:gate}=await db.rpc("get_event_gate",{p_slug:slug}).maybeSingle();
  if(!gate)return null;
  if(gate.visibility!=="public")return{title:gate.title,description:"You have a private invitation. Open the link to view it.",date:"Private invitation",photo:null,localPhoto:null,public:false};
  const{data:event}=await db.from("events").select("id,title,event_date,event_type,invitation_cover").eq("slug",slug).eq("status","published").eq("visibility","public").maybeSingle();
  if(!event)return null;
  const settings=invitationSettings(event.invitation_cover);
  const date=settings.date||invitationDate(event.event_date);
  const{data:media}=await db.from("media").select("storage_path").eq("event_id",event.id).eq("is_public",true).order("sort_order").limit(1).maybeSingle();
  const photo=media?(await db.storage.from("event-media").createSignedUrl(media.storage_path,300)).data?.signedUrl??null:null;
  const localPhoto=event.event_type!=="memorial"?(event.id===8?"/events/quoami-harry/hero.png":[1,5].includes(event.id)?"/showcase/wedding-hero.png":null):null;
  return{title:settings.names||event.title,description:`${date} · ${settings.message}`,date,photo,localPhoto,public:true};
}

export function eventShareOrigin(){
  return (process.env.NEXT_PUBLIC_SITE_URL||"https://ever-after-beta.vercel.app").replace(/\/$/,"");
}
