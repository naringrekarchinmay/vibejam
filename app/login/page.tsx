import Link from "next/link";

import { signInWithGitHub } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { safeNextPath } from "@/lib/auth/routes";

export const metadata = {
  title: "Sign in — VibeJam",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNextPath(Array.isArray(params.next) ? params.next[0] : params.next);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-4 py-12">
      <div className="flex flex-col gap-3">
        <Link href="/" className="display w-fit text-lg tracking-[-0.02em]">
          VibeJam
        </Link>
        <h1 className="display text-3xl">Sign in</h1>
        <p className="text-muted-foreground text-pretty">
          VibeJam uses your GitHub account to identify you and to read the repositories you submit.
          It never posts on your behalf.
        </p>
      </div>

      <form action={signInWithGitHub}>
        <input type="hidden" name="next" value={next} />
        <Button type="submit" size="lg" className="w-full">
          Continue with GitHub
        </Button>
      </form>

      <p className="text-muted-foreground text-xs text-pretty">
        Submitted repositories must be public. VibeJam reads code to judge it and never runs it.
      </p>
    </main>
  );
}
