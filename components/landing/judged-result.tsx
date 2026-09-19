import { ScoreFigure } from "@/components/landing/score-figure";

/**
 * A finished Jam, shown as the product actually renders one.
 *
 * This is the page's only real argument. Anyone can claim to score a project;
 * the evidence row underneath the leader is the part competitors can't fake and
 * the part PRODUCT.md's first principle turns on — a score is worth nothing
 * without the file that earned it.
 *
 * The data is illustrative but shaped exactly like the real thing: the same
 * rubric total, the same PASS/PARTIAL/FAIL vocabulary (§11), the same
 * file-plus-reason evidence shape.
 */
const STANDINGS = [
  { rank: 1, name: "Chinmay", score: 88, award: "Best UI" },
  { rank: 2, name: "Alex", score: 84, award: "Best Architecture" },
  { rank: 3, name: "Sam", score: 76, award: "Best Documentation" },
] as const;

export function JudgedResult() {
  return (
    <figure className="animate-rise m-0" style={{ animationDelay: "520ms" }}>
      <div className="border-border bg-card overflow-hidden rounded-xl border">
        <div className="border-border flex items-baseline gap-3 border-b px-5 py-3.5">
          <span className="numeric text-muted-foreground text-xs">VIBEJAM #001</span>
          <span className="text-sm font-medium">Decision Engine</span>
          <span className="text-muted-foreground ml-auto hidden text-xs sm:inline">
            judged · 3 submissions
          </span>
        </div>

        <ol className="divide-border divide-y">
          {STANDINGS.map((entry, index) => {
            const isLeader = entry.rank === 1;
            return (
              <li
                key={entry.name}
                className="grid grid-cols-[1.75rem_1fr_auto] items-center gap-4 px-5 py-4 sm:grid-cols-[1.75rem_1fr_minmax(0,13rem)_auto]"
              >
                <span
                  className={`numeric text-sm ${isLeader ? "text-primary" : "text-muted-foreground"}`}
                >
                  {String(entry.rank).padStart(2, "0")}
                </span>

                <span className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden
                    className={`size-6 shrink-0 rounded-full ${isLeader ? "bg-primary" : "bg-muted"}`}
                  />
                  <span className={`truncate text-sm ${isLeader ? "font-medium" : ""}`}>
                    {entry.name}
                  </span>
                  <span className="border-highlight/45 bg-highlight/10 text-highlight hidden shrink-0 rounded-full border px-2 py-0.5 text-[0.6875rem] sm:inline">
                    {entry.award}
                  </span>
                </span>

                {/* A short, fixed-width track so 88 vs 76 is a visible
                    difference. Spanning the full row made every bar look the
                    same length, which is decoration rather than data. Dropped
                    on mobile, where the numbers carry it alone. */}
                <span
                  aria-hidden
                  className="bg-muted hidden h-1 overflow-hidden rounded-full sm:block"
                >
                  <span
                    className={`animate-draw block h-full rounded-full ${
                      isLeader ? "bg-primary" : "bg-muted-foreground/50"
                    }`}
                    style={{
                      width: `${entry.score}%`,
                      animationDelay: `${620 + index * 110}ms`,
                    }}
                  />
                </span>

                <ScoreFigure
                  value={entry.score}
                  className={`numeric w-[2.5ch] text-right text-lg ${
                    isLeader ? "text-primary" : "text-foreground"
                  }`}
                />
              </li>
            );
          })}
        </ol>

        {/* The evidence. This is the reason the page shows a result at all. */}
        <div className="border-border bg-background/40 border-t px-5 py-4">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            {/* PASS carries an icon and a word, never color alone — the palette
                puts lime and red in play and red-green color blindness would
                otherwise erase the distinction. */}
            <span className="text-primary inline-flex items-center gap-1.5 text-xs font-medium">
              <svg viewBox="0 0 16 16" className="size-3.5" fill="none" aria-hidden>
                <path
                  d="M3.5 8.5l3 3 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              PASS
            </span>
            <span className="text-sm">Persist previous comparisons</span>
          </div>

          <p className="text-muted-foreground mt-2 text-sm text-pretty">
            Completed comparisons are written to browser storage and rehydrated on load.
          </p>

          <p className="numeric text-muted-foreground mt-2 text-xs">src/lib/storage.ts</p>
        </div>
      </div>

      <figcaption className="text-muted-foreground mt-3 text-xs text-pretty">
        Every score cites the files that earned it. Illustrative results from a completed Jam.
      </figcaption>
    </figure>
  );
}
