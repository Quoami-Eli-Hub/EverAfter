"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eventAccessCookie } from "@/lib/event-access";
import { createClient, createEventAccessClient } from "@/lib/supabase/server";

async function guestClient(slug: string) {
  const token = (await cookies()).get(eventAccessCookie(slug))?.value;
  return token ? createEventAccessClient(token) : createClient();
}

export async function unlockEvent(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))redirect("/");
  const password = String(formData.get("password") ?? "");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || password.length < 8 || password.length > 128) redirect(`/${slug}?access=invalid`);
  const supabase = await createClient();
  const { data: token } = await supabase.rpc("unlock_event", { p_slug: slug, p_password: password });
  if (!token) redirect(`/${slug}?access=invalid`);
  (await cookies()).set(eventAccessCookie(slug), token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 86400, path: `/${slug}` });
  redirect(`/${slug}?access=opened`);
}

export async function submitRsvp(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))redirect("/");
  const guestName = String(formData.get("guestName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim().slice(0, 500);
  const attendance = String(formData.get("attending"));
  const attending = attendance === "true";
  const partySize = Number(formData.get("partySize") ?? 1);
  if (String(formData.get("website") ?? "")) redirect(`/${slug}?rsvp=error#rsvp`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || guestName.length < 2 || guestName.length > 100 || !/^[+0-9() -]{7,24}$/.test(phone) || !["true", "false"].includes(attendance) || !Number.isInteger(partySize)) redirect(`/${slug}?rsvp=invalid#rsvp`);
  const supabase = await guestClient(slug);
  const { data: event } = await supabase.from("events").select("id,status,visibility,max_party_size,rsvp_enabled,rsvp_deadline").eq("slug", slug).maybeSingle();
  if (!event || event.status!=="published" || event.visibility==="private") redirect(`/${slug}?rsvp=unavailable#rsvp`);
  if (!event.rsvp_enabled || (event.rsvp_deadline && new Date(event.rsvp_deadline) < new Date())) redirect(`/${slug}?rsvp=closed#rsvp`);
  if (partySize < 1 || partySize > event.max_party_size) redirect(`/${slug}?rsvp=invalid#rsvp`);
  const { error } = await supabase.from("rsvps").insert({ event_id: event.id, guest_name: guestName, phone, attending, party_size: attending ? partySize : 1, note: note || null });
  if(error)console.error("RSVP save failed",{code:error.code});
  if(!error){revalidatePath("/dashboard/guests");revalidatePath("/dashboard");}
  redirect(`/${slug}?rsvp=${error ? "error" : "success"}#rsvp`);
}

export async function submitTribute(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))redirect("/");
  const authorName = String(formData.get("authorName") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  if (String(formData.get("website") ?? "")) redirect(`/${slug}?tribute=error#messages`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || authorName.length < 2 || authorName.length > 100 || message.length < 10 || message.length > 1500) redirect(`/${slug}?tribute=invalid#messages`);
  const supabase = await guestClient(slug);
  const { data: event } = await supabase.from("events").select("id,status,visibility,event_type").eq("slug", slug).maybeSingle();
  if (!event || event.status!=="published" || event.visibility==="private" || !["wedding", "memorial"].includes(event.event_type)) redirect(`/${slug}?tribute=unavailable#messages`);
  const { error } = await supabase.from("tributes").insert({ event_id: event.id, author_name: authorName, message, status: "pending" });
  if(error)console.error("Message save failed",{code:error.code});
  if(!error){revalidatePath("/dashboard/tributes");revalidatePath("/dashboard");}
  redirect(`/${slug}?tribute=${error ? "error" : "success"}#messages`);
}
