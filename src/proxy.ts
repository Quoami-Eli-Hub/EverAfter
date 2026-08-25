import type { NextRequest } from "next/server";
import {createClient} from "@supabase/supabase-js";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const hostname=(request.headers.get("host")??"").split(":")[0].toLowerCase();
  const siteHost=(()=>{try{return new URL(process.env.NEXT_PUBLIC_SITE_URL??"http://localhost:3000").hostname}catch{return "localhost"}})();
  const platformHost=hostname==="localhost"||hostname===siteHost||hostname.endsWith(".vercel.app");
  if(!platformHost&&request.nextUrl.pathname==="/"){
    const supabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{auth:{persistSession:false}});
    const{data:slug}=await supabase.rpc("get_event_slug_for_domain" as never,{p_hostname:hostname} as never) as {data:string|null};
    if(slug){const rewrite=request.nextUrl.clone();rewrite.pathname=`/${slug}`;return updateSession(request,rewrite)}
  }
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
