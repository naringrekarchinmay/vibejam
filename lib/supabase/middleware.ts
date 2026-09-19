import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { publicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Refreshes the Supabase session cookie on every matched request and reports
 * who the request belongs to.
 *
 * Returns the user rather than deciding anything with it: the redirect policy
 * lives in `proxy.ts`, so this module stays about sessions and cookies.
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
  let user: User | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Intentionally swallowed, leaving `user` null. A visitor is treated as
    // signed out and redirected to /login rather than the whole site
    // returning 500. Protected pages re-check the session themselves, so
    // this cannot grant access to anyone.
  }

  return { response, user };
}
