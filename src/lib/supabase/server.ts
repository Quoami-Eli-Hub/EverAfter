import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet, headers) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components cannot write cookies; proxy.ts refreshes them.
          }
          void headers;
        },
      },
    },
  );
}

export async function createEventAccessClient(token: string) {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: { "x-event-access-token": token } },
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll() {
          // Protected-page reads do not refresh authentication state.
        },
      },
    },
  );
}

export function createAdminClient() {
  const secret=process.env.SUPABASE_SECRET_KEY;
  if(!secret) throw new Error("SUPABASE_SECRET_KEY is not configured");
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,secret,{auth:{persistSession:false,autoRefreshToken:false}});
}
