"use server";
import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";
import {getOwnerEvent} from "@/lib/event-owner";

export async function addCollaborator(form:FormData){
  const{db,event,role}=await getOwnerEvent();
  if(role!=="owner")redirect("/dashboard/team?message=Only+the+event+owner+can+manage+the+team");
  const email=String(form.get("email")??"").trim().toLowerCase();
  const memberRole=String(form.get("role")??"");
  if(!email.includes("@")||!["planner","contributor","viewer"].includes(memberRole))redirect("/dashboard/team?message=Enter+a+valid+email+and+role");
  const{error}=await db.rpc("add_event_member",{p_event_id:event.id,p_email:email,p_role:memberRole});
  if(error)redirect(`/dashboard/team?message=${encodeURIComponent(error.message)}`);
  revalidatePath("/dashboard/team");redirect("/dashboard/team?message=added");
}

export async function removeCollaborator(form:FormData){
  const{db,event,role}=await getOwnerEvent();
  if(role!=="owner")redirect("/dashboard/team?message=Only+the+event+owner+can+manage+the+team");
  const userId=String(form.get("userId")??"");
  const{error}=await db.rpc("remove_event_member",{p_event_id:event.id,p_user_id:userId});
  if(error)redirect(`/dashboard/team?message=${encodeURIComponent(error.message)}`);
  revalidatePath("/dashboard/team");redirect("/dashboard/team?message=removed");
}
