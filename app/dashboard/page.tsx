import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Dashboard — VibeJam",
};

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();

  // Re-checked here rather than trusting the proxy. The proxy redirect is for
  // UX; this is the access boundary (§25).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=%2Fdashboard");

  // RLS restricts this to the caller's own row (migration 0001).
  const { data: profile } = await supabase
    .from("users")
    .select("github_username, display_name, avatar_url")
    .eq("id", user.id)
    .single();

  const name = profile?.display_name ?? profile?.github_username ?? "there";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col gap-10 px-4 py-12">
      <header className="flex items-center justify-between gap-4">
        <span className="display text-lg tracking-[-0.02em]">VibeJam</span>
        <SignOutButton />
      </header>

      <div className="flex flex-col gap-2">
        <h1 className="display text-3xl">Hello, {name}</h1>
        {profile ? (
          <p className="numeric text-muted-foreground text-sm">@{profile.github_username}</p>
        ) : (
          <p className="text-muted-foreground text-sm text-pretty">
            Your profile hasn&apos;t synced yet. Signing out and back in will create it.
          </p>
        )}
      </div>

      <section className="border-border rounded-xl border border-dashed p-8 text-center">
        <p className="text-muted-foreground text-pretty">
          Jams appear here once Jam creation ships in Phase 3.
        </p>
      </section>
    </main>
  );
}
