import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { getServerEnv, publicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Server-side client scoped to the caller's session.
 *
 * Anon key plus the request's cookies, so RLS applies. Use this for anything
 * that serves a user request — it is the default, and `createServiceRoleClient`
 * below is the exception.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components get a read-only cookie store. Middleware
            // refreshes the session on every request, so a failed write here
            // is expected rather than a problem.
          }
        },
      },
    },
  );
}

/**
 * DANGER: bypasses Row Level Security entirely.
 *
 * Only the judging pipeline (§12) may use this. It legitimately reads every
 * submission in a Jam and writes scores on behalf of no user, which is exactly
 * what RLS is designed to prevent.
 *
 * Never call this from a route that serves a user request. If a feature seems
 * to need it, the RLS policy is probably wrong — fix the policy (§25).
 *
 * The key is read here rather than at module scope, so importing this file is
 * always safe and `next build` succeeds without credentials.
 */
export function createServiceRoleClient() {
  const { SUPABASE_SERVICE_ROLE_KEY } = getServerEnv();

  return createClient<Database>(publicEnv.NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
