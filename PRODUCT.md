# Product

## Register

product

## Users

Developers who already know each other. The MVP unit is three friends running one
private competition — not strangers, not an audience. They arrive either from GitHub
OAuth or from an invite link someone sent them in a chat.

Their context is a laptop, mid-session, with an editor open in another window. They
are in one of two states, and the two want opposite things from the interface:

- **Coordinating** — short, impatient bursts. Create a Jam, join one, check who has
  submitted, kick off judging. Seconds of attention. The screen should answer the
  question and get out of the way.
- **Building** — one long, tense stretch inside the build window. VibeJam is a
  background tab they glance at. The only things that matter are how long is left
  and whether anyone has submitted yet.

The job they're hiring VibeJam for: **settle who built the better thing, fairly,
with reasons they can argue with.** Bragging rights are the hook; the reasons are
why they come back.

## Product Purpose

VibeJam runs a small vibe-coding competition end to end: one generated challenge,
one shared clock, independent builds, then structured AI judging of each submitted
repository against a fixed rubric.

It exists because the informal version of this — "let's both build something and see
whose is better" — always collapses at the judging step. There is no neutral party,
so the argument is unresolvable and nobody learns anything.

Success is narrow and concrete: three people complete one full Jam, and all three
open the results page and read the feedback — including whoever came last.

## Brand Personality

**Playful, technical, polished** (the project's own three words).

Voice is plain and direct. It talks to developers as peers: no exclamation marks, no
"Awesome!", no mascot enthusiasm. Competitive without being aggressive — the product
declares a winner but never mocks a loser, because the losing participants are the
ones the learning features exist for.

Technical detail is treated as interesting, not as something to hide. Commit SHAs,
file paths and rubric maths are shown plainly rather than smoothed away; that
specificity is what makes the judging feel trustworthy rather than arbitrary.

Emotional goals, in order: **trust** (this score is fair), **tension** (the clock is
running), **curiosity** (why did they beat me?).

## Anti-references

- **Generic enterprise dashboard.** Named explicitly in the spec. Card grid, sidebar,
  muted blue-grey, every surface equally weighted.
- **Hackathon-platform cruft** (Devpost-shaped). Dense chrome, sponsor logos, form
  after form, the actual competition buried.
- **Badge-spam gamification.** Streaks, confetti, XP bars, achievement toasts.
  VibeJam has awards, but they are earned from rubric evidence, not sprinkled for
  engagement.
- **SaaS landing clichés.** The hero-metric template, the identical three-card
  feature grid, the testimonial wall, the pricing table. `/` is a door for invited
  friends, not a campaign page.
- **Leaderboards that humiliate.** Last place rendered in red, shrinking, or greyed
  out. Third of three is still someone who shipped something.

## Design Principles

1. **Evidence over verdict.** The product's entire claim is that its scores are
   justified. A number without a visible path to the file that earned it is a number
   nobody believes. Every score should be one interaction from its reasoning.

2. **The clock is shared.** Fairness is the product, not a feature of it. Anything
   that could let two participants see different state — a drifting timer, a stale
   status, a submission that slipped in late — is a correctness bug, and the
   interface should make the sameness visible rather than merely true.

3. **Losing should teach.** The head-to-head comparison is the reason to return, not
   a bonus screen. Design so that the person who came third has a concrete reason to
   open the results page and read past their own row.

4. **Never leak what isn't finished.** During an active Jam, one participant seeing
   another's repository breaks the competition. The interface must have no path —
   not a link, not a tooltip, not an API response — that reveals it early.

5. **Show the seams honestly.** The MVP judges repository evidence; it does not run
   anything. The interface must never imply verified runtime behavior it did not
   observe. Where the system is uncertain, it says so.

## Accessibility & Inclusion

Target: **WCAG 2.2 AA.**

- Body text ≥4.5:1 against its background; large text (≥18px, or bold ≥14px) ≥3:1.
  Verify each pairing against the actual token values rather than assuming.
- Visible focus indicator on every interactive element. Full keyboard paths through
  every flow, including submission and judging.
- `prefers-reduced-motion` honored everywhere. The countdown in particular must not
  depend on animation to be legible.
- **Color is never the only signal.** This matters more here than in most products:
  the palette uses lime for the leader, amber for awards and red for failure, and
  red-green color blindness affects the lime-versus-red distinction specifically.
  Requirement statuses (PASS / PARTIAL / FAIL) carry an icon and a word; the leader
  row carries position and weight; awards carry a label.
- Countdown timers are an accessibility hazard when they are the only cue. Remaining
  time must be readable as text, not inferred from a bar or a color shift.
