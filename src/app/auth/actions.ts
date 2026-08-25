"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function credentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email.includes("@") || password.length < 8) {
    redirect("/login?message=Enter+a+valid+email+and+a+password+of+at+least+8+characters");
  }
  return { email, password };
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(credentials(formData));
  if (error) redirect(`/login?message=${encodeURIComponent(error.message)}`);
  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const { email, password } = credentials(formData);
  const displayName = String(formData.get("displayName") ?? "").trim();
  if (displayName.length < 2) redirect("/login?mode=signup&message=Please+enter+your+name");
  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: displayName }, emailRedirectTo: `${origin}/auth/callback?next=/onboarding` },
  });
  if (error) redirect(`/login?mode=signup&message=${encodeURIComponent(error.message)}`);
  if (!data.session) redirect("/login?message=Check+your+email+to+confirm+your+account");
  redirect("/onboarding");
}

export async function signInWithGoogle() {
  if (process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED !== "true") redirect("/login?message=Google+sign-in+is+not+configured+yet.+Use+email+and+password.");
  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback?next=/onboarding` },
  });
  if (error || !data.url) redirect(`/login?message=${encodeURIComponent(error?.message ?? "Google sign-in failed")}`);
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(formData:FormData){
  const email=String(formData.get("email")??"").trim().toLowerCase();
  if(!email.includes("@"))redirect("/forgot-password?message=Enter+a+valid+email");
  const supabase=await createClient();const origin=(await headers()).get("origin")??"http://localhost:3000";
  await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${origin}/auth/callback?next=/reset-password`});
  redirect("/forgot-password?message=If+the+account+exists,+a+reset+link+has+been+sent");
}

export async function updatePassword(formData:FormData){
  const password=String(formData.get("password")??"");const confirm=String(formData.get("confirm")??"");
  if(password.length<12||password!==confirm)redirect("/reset-password?message=Passwords+must+match+and+contain+at+least+12+characters");
  const supabase=await createClient();const{error}=await supabase.auth.updateUser({password});
  if(error)redirect(`/reset-password?message=${encodeURIComponent(error.message)}`);
  redirect("/login?message=Password+updated.+Please+sign+in");
}
