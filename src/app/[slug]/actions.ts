"use server";

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
  const password = String(formData.get("password") ?? "");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || password.length < 8 || password.length > 128) redirect(`/${slug}?access=invalid`);
  const supabase = await createClient();
  const { data: token } = await supabase.rpc("unlock_event", { p_slug: slug, p_password: password });
  if (!token) redirect(`/${slug}?access=invalid`);
  (await cookies()).set(eventAccessCookie(slug), token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 86400, path: `/${slug}` });
  redirect(`/${slug}`);
}

export async function submitRsvp(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const guestName = String(formData.get("guestName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim().slice(0, 500);
  const attending = String(formData.get("attending")) === "true";
  const partySize = Number(formData.get("partySize") ?? 1);
  if (String(formData.get("website") ?? "")) redirect(`/${slug}?rsvp=error#rsvp`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || guestName.length < 2 || guestName.length > 100 || !/^[+0-9() -]{7,24}$/.test(phone) || !Number.isInteger(partySize)) redirect(`/${slug}?rsvp=invalid#rsvp`);
  const supabase = await guestClient(slug);
  const { data: event } = await supabase.from("events").select("id,max_party_size,rsvp_enabled,rsvp_deadline").eq("slug", slug).eq("status", "published").maybeSingle();
  if (!event || !event.rsvp_enabled || partySize < 1 || partySize > event.max_party_size || (event.rsvp_deadline && new Date(event.rsvp_deadline) < new Date())) redirect(`/${slug}?rsvp=closed#rsvp`);
  const { error } = await supabase.from("rsvps").insert({ event_id: event.id, guest_name: guestName, phone, attending, party_size: attending ? partySize : 1, note: note || null });
  redirect(`/${slug}?rsvp=${error ? "error" : "success"}#rsvp`);
}

export async function submitTribute(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const authorName = String(formData.get("authorName") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  if (String(formData.get("website") ?? "")) redirect(`/${slug}?tribute=error#tributes`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || authorName.length < 2 || authorName.length > 100 || message.length < 10 || message.length > 1500) redirect(`/${slug}?tribute=invalid#tributes`);
  const supabase = await guestClient(slug);
  const { data: event } = await supabase.from("events").select("id,event_type").eq("slug", slug).eq("status", "published").maybeSingle();
  if (!event || !["wedding", "memorial"].includes(event.event_type)) redirect(`/${slug}?tribute=error#tributes`);
  const { error } = await supabase.from("tributes").insert({ event_id: event.id, author_name: authorName, message });
  redirect(`/${slug}?tribute=${error ? "error" : "success"}#tributes`);
}
