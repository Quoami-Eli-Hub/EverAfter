"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {getOwnerEvent} from "@/lib/event-owner";
async function ownerEvent(){return getOwnerEvent()}
export async function updateEvent(form:FormData){const {supabase,event}=await ownerEvent();const status=["draft","published","unpublished"].includes(String(form.get("status")))?String(form.get("status")):"draft";const visibility=["public","protected","private"].includes(String(form.get("visibility")))?String(form.get("visibility")):"private";const title=String(form.get("title")??"").trim().slice(0,120);const excerpt=String(form.get("excerpt")??"").trim().slice(0,500);const eventDate=String(form.get("eventDate")??"")||null;const deadline=String(form.get("rsvpDeadline")??"")||null;const maxParty=Math.min(20,Math.max(1,Number(form.get("maxPartySize"))||1));const requestedTheme=String(form.get("theme"));const theme=["classic","garden","editorial"].includes(requestedTheme)||(event.plan_code==="premium"&&["cinematic","minimalist"].includes(requestedTheme))?requestedTheme:"classic";const color=["rose","sage","champagne","terracotta","plum","midnight"].includes(String(form.get("color")))?String(form.get("color")):"rose";const font=["editorial","modern","romantic"].includes(String(form.get("font")))?String(form.get("font")):"editorial";const published=status==="published";if((eventDate&&Number.isNaN(new Date(eventDate).getTime()))||(deadline&&Number.isNaN(new Date(deadline).getTime()))||!Number.isInteger(maxParty))redirect("/dashboard/settings?message=Enter+valid+dates+and+a+whole+number+for+party+size");if(!title)redirect("/dashboard/settings?message=Please+enter+a+title+for+your+event+page");const{data,error}=await supabase.from("events").update({title,excerpt,event_date:eventDate,status,visibility,published_at:published?new Date().toISOString():null,rsvp_enabled:form.get("rsvpEnabled")==="on",rsvp_deadline:deadline?new Date(deadline).toISOString():null,max_party_size:maxParty,allow_photo_downloads:form.get("allowDownloads")==="on",theme_key:theme,color_key:color,font_key:font}).eq("id",event.id).select("id").maybeSingle();if(error)redirect("/dashboard/settings?message=We+couldn’t+save+your+settings.+Please+try+again");if(!data)redirect("/dashboard/settings?message=We+couldn’t+save+your+settings.+Please+refresh+and+try+again");revalidatePath("/dashboard/settings");revalidatePath("/dashboard");revalidatePath(`/${event.slug}`);redirect("/dashboard/settings?message=saved")}
export async function updateSection(form:FormData){const {supabase,event}=await ownerEvent();const id=Number(form.get("id"));if(!Number.isSafeInteger(id)||id<1)return{ok:false,message:"This section could not be identified. Refresh the page and try again."};const heading=String(form.get("heading")??"").trim().slice(0,160);const body=String(form.get("body")??"").trim().slice(0,10000);const{data,error}=await supabase.from("event_sections").update({heading:heading||null,body:{text:body},is_visible:form.get("visible")==="on"}).eq("id",id).eq("event_id",event.id).select("id").maybeSingle();if(error)return{ok:false,message:"We couldn’t save this section. Check your connection and try again."};if(!data)return{ok:false,message:"The section was not saved. Please refresh and try again."};revalidatePath(`/${event.slug}`);return{ok:true,message:"Your changes have been saved."}}
export async function addVenue(form:FormData){
 const {supabase,event}=await ownerEvent();
 const name=String(form.get("name")??"").trim();const mapUrl=String(form.get("mapUrl")??"").trim();
 if(!name)redirect("/dashboard/schedule?message=Enter+a+venue+name");
 if(mapUrl&&!/^https?:\/\//i.test(mapUrl))redirect("/dashboard/schedule?message=Enter+a+valid+http+or+https+map+link");
 const{error}=await supabase.from("venues").insert({event_id:event.id,name,address:String(form.get("address")??"").trim(),map_url:mapUrl||null,directions:String(form.get("directions")??"").trim()||null});
 if(error)redirect("/dashboard/schedule?message=The+venue+could+not+be+saved.+Check+your+permissions+and+try+again");
 revalidatePath("/dashboard/schedule");revalidatePath("/"+event.slug);redirect("/dashboard/schedule?message=saved");
}
export async function addSchedule(form:FormData){
 const {supabase,event}=await ownerEvent();const title=String(form.get("title")??"").trim();const startsAt=new Date(String(form.get("startsAt")??""));const venueId=Number(form.get("venueId"))||null;
 if(!title||Number.isNaN(startsAt.getTime()))redirect("/dashboard/schedule?message=Enter+a+title+and+valid+date+and+time");
 if(venueId){const{data:venue}=await supabase.from("venues").select("id").eq("id",venueId).eq("event_id",event.id).maybeSingle();if(!venue)redirect("/dashboard/schedule?message=Choose+a+venue+from+this+event");}
 const{error}=await supabase.from("schedule_items").insert({event_id:event.id,title,description:String(form.get("description")??"").trim()||null,starts_at:startsAt.toISOString(),venue_id:venueId});
 if(error)redirect("/dashboard/schedule?message=The+schedule+item+could+not+be+saved.+Check+your+permissions+and+try+again");
 revalidatePath("/dashboard/schedule");revalidatePath("/"+event.slug);redirect("/dashboard/schedule?message=saved");
}
export async function deleteRecord(form:FormData){const {supabase,event}=await ownerEvent();const table=String(form.get("table"));const allowed=["venues","schedule_items","albums","media","documents"] as const;if(!allowed.includes(table as typeof allowed[number]))return;const id=Number(form.get("id"));if(!Number.isSafeInteger(id))return;if(table==="media"||table==="documents"){const {data:file}=await supabase.from(table).select("storage_path").eq("id",id).eq("event_id",event.id).maybeSingle();if(file?.storage_path)await supabase.storage.from("event-media").remove([file.storage_path])}await supabase.from(table as typeof allowed[number]).delete().eq("id",id).eq("event_id",event.id);revalidatePath("/dashboard/schedule");revalidatePath("/dashboard/gallery");revalidatePath(`/${event.slug}`)}
export async function updateRsvp(form:FormData){
 const {supabase,event}=await ownerEvent();const id=Number(form.get("id"));const action=String(form.get("action"));
 if(!Number.isSafeInteger(id)||!["delete","checkin","undo"].includes(action))redirect("/dashboard/guests?message=Choose+a+valid+guest+action");
 const result=action==="delete"?await supabase.from("rsvps").delete().eq("id",id).eq("event_id",event.id).select("id"):await supabase.from("rsvps").update({checked_in_at:action==="checkin"?new Date().toISOString():null}).eq("id",id).eq("event_id",event.id).select("id");
 if(result.error||!result.data?.length)redirect("/dashboard/guests?message=The+response+could+not+be+updated.+Refresh+and+check+your+permissions");
 revalidatePath("/dashboard/guests");revalidatePath("/dashboard");redirect("/dashboard/guests?message=saved");
}
export async function moderateTribute(form:FormData){
 const {supabase,event}=await ownerEvent();const id=Number(form.get("id"));const status=String(form.get("status"));
 if(!Number.isSafeInteger(id)||!["approved","rejected"].includes(status))redirect("/dashboard/tributes?message=Choose+a+valid+message+and+moderation+action");
 const{data,error}=await supabase.from("tributes").update({status,moderated_at:new Date().toISOString()}).eq("id",id).eq("event_id",event.id).select("id");
 if(error||!data?.length)redirect("/dashboard/tributes?message=The+message+could+not+be+updated.+Refresh+and+check+your+permissions");
 revalidatePath("/dashboard/tributes");revalidatePath("/dashboard");revalidatePath("/"+event.slug);redirect("/dashboard/tributes?message=saved");
}
export async function createAlbum(form:FormData){
 const {supabase,event}=await ownerEvent();const title=String(form.get("title")??"").trim();
 if(!title||title.length>80)redirect("/dashboard/gallery?message=Enter+an+album+title+of+1+to+80+characters");
 const{error}=await supabase.from("albums").insert({event_id:event.id,title,description:String(form.get("description")??"").trim()||null,allow_downloads:form.get("allowDownloads")==="on"});
 if(error)redirect("/dashboard/gallery?message=The+album+could+not+be+saved.+Check+your+permissions+and+try+again");
 revalidatePath("/dashboard/gallery");revalidatePath("/"+event.slug);redirect("/dashboard/gallery?message=saved");
}
export async function setPublicationStatus(form:FormData){const{supabase,event}=await ownerEvent();const publish=String(form.get("publish"))==="true";if(publish&&event.visibility==="private")redirect("/dashboard/settings?message=Choose+Public+or+Password+protected+visibility+before+publishing+for+guests");const{data,error}=await supabase.from("events").update({status:publish?"published":"draft",published_at:publish?new Date().toISOString():null}).eq("id",event.id).select("id").maybeSingle();if(error||!data)redirect("/dashboard/settings?message=We+couldn’t+update+the+page+status.+Please+try+again");revalidatePath("/dashboard");revalidatePath(`/${event.slug}`);redirect("/dashboard")}

export async function setEventPassword(form:FormData){const{supabase,event}=await ownerEvent();const password=String(form.get("password")??"");const confirm=String(form.get("confirm")??"");if(password.length<8||password.length>128||password!==confirm)redirect("/dashboard/settings?password=invalid");const{error}=await supabase.rpc("set_event_password",{p_event_id:event.id,p_password:password});if(error)redirect("/dashboard/settings?password=invalid");revalidatePath(`/${event.slug}`);redirect("/dashboard/settings?password=saved")}

export async function clearEventPassword(){const{supabase,event}=await ownerEvent();const{error}=await supabase.rpc("clear_event_password",{p_event_id:event.id});if(error)redirect("/dashboard/settings?message=The+event+password+could+not+be+removed");const{data,error:updateError}=await supabase.from("events").update({visibility:"private"}).eq("id",event.id).select("id").maybeSingle();if(updateError||!data)redirect("/dashboard/settings?message=Please+refresh+and+check+the+event+visibility");revalidatePath(`/${event.slug}`);redirect("/dashboard/settings?password=cleared")}
