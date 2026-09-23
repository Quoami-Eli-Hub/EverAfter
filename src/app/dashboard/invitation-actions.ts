"use server";

import { revalidatePath } from "next/cache";
import { getOwnerEvent } from "@/lib/event-owner";
import { invitationSettings } from "@/lib/invitation";

export async function saveInvitationCover(_previous: { ok: boolean; message: string }, form: FormData) {
  const { supabase, event, role } = await getOwnerEvent();
  if (!["owner", "planner"].includes(role)) return { ok: false, message: "Only the event owner or planner can change this invitation." };
  if (Number(form.get("eventId")) !== event.id) return { ok: false, message: "Your active event changed. Refresh before saving." };
  const settings = invitationSettings({ enabled: true, names: form.get("names"), date: form.get("date"), message: form.get("message"), button: form.get("button"), emblem: form.get("emblem") });
  const { data, error } = await supabase.from("events").update({ invitation_cover: settings }).eq("id", event.id).select("id").maybeSingle();
  if (error || !data) return { ok: false, message: "Your invitation could not be saved. Please try again." };
  revalidatePath("/dashboard/settings");
  revalidatePath(`/${event.slug}`);
  return { ok: true, message: "Invitation saved. Your event page now uses these settings." };
}
