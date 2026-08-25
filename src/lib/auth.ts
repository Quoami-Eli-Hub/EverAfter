import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return { id: data.claims.sub, email: data.claims.email as string | undefined };
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?message=Please+sign+in+to+continue");
  return user;
}
