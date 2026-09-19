import Link from "next/link";

import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <div className="flex flex-col items-start gap-6">
      <h1
        className="display animate-rise text-[clamp(2.75rem,8vw,5rem)]"
        style={{ animationDelay: "40ms" }}
      >
        Settle it in code.
      </h1>

      <p
        className="animate-rise text-muted-foreground max-w-[58ch] text-lg leading-relaxed text-pretty"
        style={{ animationDelay: "120ms" }}
      >
        Three friends, one challenge, one clock. Build independently, submit a repo, and get scored
        on the same rubric — with the files that earned every point.
      </p>

      <div className="animate-rise flex flex-wrap gap-3" style={{ animationDelay: "200ms" }}>
        <Button asChild size="lg">
          <Link href="/login">Start a Jam</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/login">Sign in with GitHub</Link>
        </Button>
      </div>
    </div>
  );
}
