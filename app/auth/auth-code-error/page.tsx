import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Sign-in failed — VibeJam",
};

export default function AuthCodeErrorPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-4 py-12">
      <h1 className="display text-3xl">Sign-in didn&apos;t complete</h1>

      {/* Deliberately does not guess at the cause. The app genuinely cannot
          tell a declined consent screen from an expired code here, and
          claiming otherwise would send people chasing the wrong fix. */}
      <p className="text-muted-foreground text-pretty">
        GitHub sent us back without a usable sign-in code. That usually means the request was
        declined, or it sat long enough for the code to expire.
      </p>

      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/login">Try again</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </main>
  );
}
