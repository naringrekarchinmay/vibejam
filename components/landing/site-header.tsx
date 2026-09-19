/**
 * The wordmark lockup. The tagline lives here, once, as part of the brand mark
 * rather than as a tracked label above the headline — a kicker above every
 * section is the saturated AI tell, and this page had two of them.
 */
export function SiteHeader() {
  return (
    <header className="flex items-baseline gap-3">
      <span className="display text-lg tracking-[-0.02em]">VibeJam</span>
      <span className="numeric text-muted-foreground text-xs">Build. Compete. Ship.</span>
    </header>
  );
}
