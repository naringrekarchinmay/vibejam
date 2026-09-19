/**
 * The VibeJam product loop, rendered as a sequence rather than a grid of cards.
 *
 * The numbers stay because this genuinely is an ordered flow and the order is
 * the information — that is the one case where numbered markers earn their
 * place rather than acting as scaffolding. A connecting rule carries the
 * direction; the numbers punch through it.
 */
const STEPS = [
  "Create a Jam",
  "Generate a challenge",
  "Invite friends",
  "Build independently",
  "Submit your repo",
  "Get judged",
  "Compare results",
] as const;

export function ProductLoop() {
  return (
    <ol className="grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-4 lg:grid-cols-7">
      {STEPS.map((step, index) => (
        <li
          key={step}
          className="animate-rise relative pt-6"
          style={{ animationDelay: `${120 + index * 55}ms` }}
        >
          {/* The rule runs behind the number, which masks it with the page
              background so the sequence reads as one continuous line. */}
          <span aria-hidden className="bg-border absolute top-[7px] right-0 left-0 h-px" />
          <span className="numeric bg-background text-muted-foreground absolute top-0 left-0 pr-2 text-[0.6875rem] leading-[15px]">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="block text-sm text-pretty">{step}</span>
        </li>
      ))}
    </ol>
  );
}
