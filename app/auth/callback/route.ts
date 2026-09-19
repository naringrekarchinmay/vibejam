import { NextResponse, type NextRequest } from "next/server";

import { safeNextPath } from "@/lib/auth/routes";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Completes the PKCE flow: Supabase redirects here with a one-time code, which
 * is exchanged for a session using the verifier held in a cookie.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  // GitHub or Supabase can return an error instead of a code — most commonly
  // when the user declines authorization on the consent screen.
  if (searchParams.get("error") || !code) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
