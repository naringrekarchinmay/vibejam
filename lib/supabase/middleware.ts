import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { publicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Refreshes the Supabase session cookie on every matched request.
 *
 * Route protection is deliberately NOT here yet. Phase 2 adds it once real
 * authentication exists; adding redirect logic now would be guarding routes
 * that nobody can reach.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Touching getUser() is what triggers the token refresh. Do not remove.
  //
  // It must not be allowed to throw. This runs on nearly every request, so an
  // unguarded rejection during a Supabase outage or a misconfigured URL would
  // return 500 for every route — including the landing page and the public
  // results page, neither of which needs authentication at all. Failing to
  // refresh degrades a visitor to logged-out; failing open degrades the whole
  // site (§34).
  try {
    await supabase.auth.getUser();
  } catch {
    // Intentionally swallowed. Route protection is enforced per-route from
    // Phase 2 onward, so a stale session here cannot grant access.
  }

  return response;
}
