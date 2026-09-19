"use server";

import { redirect } from "next/navigation";

import { safeNextPath } from "@/lib/auth/routes";
import { publicEnv } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function signInWithGitHub(formData: FormData) {
  const next = safeNextPath(formData.get("next")?.toString());
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      // Supabase sends the user back here with a one-time PKCE code. The
      // matching verifier is written to a cookie by this call, which is why
      // the flow has to start on the server.
      redirectTo: `${publicEnv.NEXT_PUBLIC_APP_URL}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) {
    redirect("/auth/auth-code-error");
  }

  redirect(data.url);
}
