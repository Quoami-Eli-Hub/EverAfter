"use server";

import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

const notice=(path:string,message:string,tone:"error"|"success"|"info"="error")=>`${path}${path.includes("?")?"&":"?"}message=${encodeURIComponent(message)}&tone=${tone}`;
const siteUrl=()=>{
  const configured=process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if(configured)return configured.replace(/\/$/,"");
  const vercelHost=process.env.VERCEL_PROJECT_PRODUCTION_URL??process.env.VERCEL_URL;
  return vercelHost?`https://${vercelHost}`:"http://localhost:3000";
};

function credentials(formData:FormData){
  const email=String(formData.get("email")??"").trim().toLowerCase();
  const password=String(formData.get("password")??"");
  if(!email.includes("@")||password.length<8)redirect(notice("/login","Enter a valid email address and a password of at least 8 characters."));
  return{email,password};
}

function friendlyAuthError(message:string,context:"signin"|"signup"|"password"){
  const value=message.toLowerCase();
  if(value.includes("invalid login")||value.includes("invalid credentials"))return "We couldn’t sign you in. Check your email and password, then try again.";
  if(value.includes("email not confirmed"))return "Please confirm your email address before signing in.";
  if(value.includes("already registered")||value.includes("already exists"))return "An account already exists for this email. Sign in or reset your password.";
  if(value.includes("password")&&(value.includes("weak")||value.includes("short")))return "Choose a stronger password with at least 12 characters.";
  if(value.includes("rate")||value.includes("too many"))return "Too many attempts were made. Please wait a few minutes and try again.";
  if(context==="signup")return "We couldn’t create your account right now. Please review your details and try again.";
  if(context==="password")return "We couldn’t update your password. Please request a new reset link and try again.";
  return "We couldn’t sign you in right now. Please try again shortly.";
}

export async function signIn(formData:FormData){
  const supabase=await createClient();
  const{error}=await supabase.auth.signInWithPassword(credentials(formData));
  if(error)redirect(notice("/login",friendlyAuthError(error.message,"signin")));
  redirect("/dashboard");
}

export async function signUp(formData:FormData){
  const supabase=await createClient();
  const{email,password}=credentials(formData);
  const displayName=String(formData.get("displayName")??"").trim();
  if(displayName.length<2)redirect(notice("/login?mode=signup","Please enter the name you would like us to use."));
  const{data,error}=await supabase.auth.signUp({email,password,options:{data:{full_name:displayName},emailRedirectTo:`${siteUrl()}/auth/callback?next=/onboarding`}});
  if(error)redirect(notice("/login?mode=signup",friendlyAuthError(error.message,"signup")));
  if(!data.session)redirect(notice("/login","Check your inbox and confirm your email address to finish creating your account.","success"));
  redirect("/onboarding");
}

export async function signInWithGoogle(){
  if(process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED!=="true")redirect(notice("/login","Google sign-in is not available yet. Please continue with your email and password.","info"));
  const supabase=await createClient();
  const{data,error}=await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:`${siteUrl()}/auth/callback?next=/onboarding`}});
  if(error||!data.url)redirect(notice("/login","Google sign-in could not start. Please use your email and password or try again shortly."));
  redirect(data.url);
}

export async function signOut(){const supabase=await createClient();await supabase.auth.signOut();redirect("/")}

export async function requestPasswordReset(formData:FormData){
  const email=String(formData.get("email")??"").trim().toLowerCase();
  if(!email.includes("@"))redirect(notice("/forgot-password","Enter the email address connected to your account."));
  const supabase=await createClient();
  await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${siteUrl()}/auth/callback?next=/reset-password`});
  redirect(notice("/forgot-password","If an account matches that email, a secure reset link is on its way.","success"));
}

export async function updatePassword(formData:FormData){
  const password=String(formData.get("password")??"");const confirm=String(formData.get("confirm")??"");
  if(password.length<12)redirect(notice("/reset-password","Use at least 12 characters for your new password."));
  if(password!==confirm)redirect(notice("/reset-password","The passwords do not match. Please enter them again."));
  const supabase=await createClient();const{error}=await supabase.auth.updateUser({password});
  if(error)redirect(notice("/reset-password",friendlyAuthError(error.message,"password")));
  redirect(notice("/login","Your password has been updated. You can now sign in.","success"));
}
