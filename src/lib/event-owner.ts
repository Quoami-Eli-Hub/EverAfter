import {redirect} from "next/navigation";
import {requireUser} from "@/lib/auth";
import {createClient} from "@/lib/supabase/server";
export async function getOwnerEvent(){const user=await requireUser();const supabase=await createClient();const {data:event}=await supabase.from("events").select("*").eq("owner_id",user.id).single();if(!event)redirect("/onboarding");return{supabase,event,user}}
