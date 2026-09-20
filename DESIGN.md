---
name: VibeJam
description: Vibe-coding competitions judged on evidence — a dark scoreboard where one lit number carries the signal.
colors:
  background: "oklch(0.145 0 0)"
  foreground: "oklch(0.985 0 0)"
  surface-card: "oklch(0.185 0 0)"
  surface-muted: "oklch(0.24 0 0)"
  border-hairline: "oklch(0.26 0 0)"
  text-muted: "oklch(0.68 0 0)"
  scoreboard-lime: "oklch(0.82 0.21 130)"
  award-amber: "oklch(0.78 0.16 70)"
  failure-red: "oklch(0.704 0.191 22.216)"
  on-accent: "oklch(0.145 0 0)"
typography:
  display:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 8vw, 5rem)"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "-0.03em"
    fontVariation: "'wdth' 112"
  headline:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "-0.03em"
    fontVariation: "'wdth' 112"
  title:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "normal"
  label:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
  numeric:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "normal"
    fontFeature: "'tnum' 1"
rounded:
  sm: "0.3rem"
  md: "0.4rem"
  lg: "0.5rem"
  xl: "0.7rem"
  pill: "9999px"
spacing:
  2xs: "0.25rem"
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  2xl: "3rem"
  3xl: "4rem"
  4xl: "6rem"
components:
  button-primary:
    backgroundColor: "{colors.scoreboard-lime}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.lg}"
    padding: "0 0.625rem"
    height: "2.25rem"
    typography: "{typography.title}"
  button-primary-hover:
    backgroundColor: "oklch(0.82 0.21 130 / 0.8)"
    textColor: "{colors.on-accent}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "0 0.625rem"
    height: "2.25rem"
  button-outline-hover:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.foreground}"
  panel:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: "1.25rem"
  badge-award:
    backgroundColor: "oklch(0.78 0.16 70 / 0.1)"
    textColor: "{colors.award-amber}"
    rounded: "{rounded.pill}"
    padding: "0.125rem 0.5rem"
  leaderboard-row-leader:
    backgroundColor: "transparent"
    textColor: "{colors.scoreboard-lime}"
    padding: "1rem 1.25rem"
    typography: "{typography.numeric}"
---

# Design System: VibeJam

> Colors are expressed in OKLCH, not hex. The codebase is OKLCH throughout —
> Tailwind v4 and shadcn both emit it — and splitting the source of truth so a
> linter is happier would be the wrong trade. Stitch's linter will warn; that is
> accepted. sRGB approximations appear in prose for reference only.

## 1. Overview

**Creative North Star: "The Lit Scoreboard"**

A scoreboard in a dark room. Almost everything recedes into near-black, and one
lime figure carries the live number — the countdown, the leading score, the single
action worth taking. The accent is not decoration layered onto the interface; it
*is* the signal, and its scarcity is what makes it readable at a glance from
across the room.

The system is built for two opposite moods in the same product. Coordinating a Jam
is impatient and brief: answer the question, get out of the way. Building inside
one is long and tense, with VibeJam sitting in a background tab where only two
facts matter — how long is left, and whether anyone has submitted. Density serves
the first; a single dominant lit element serves the second.

Technical detail is treated as interesting rather than as something to hide.
Commit SHAs, file paths and rubric arithmetic are set in monospace and shown
plainly, because that specificity is what makes an AI-generated score feel
trustworthy instead of arbitrary. This system explicitly rejects the generic
enterprise dashboard, hackathon-platform cruft, badge-spam gamification, SaaS
landing clichés, and any leaderboard treatment that humiliates last place.

**Key Characteristics:**

- Dark by default and dark only — there is no light theme in the MVP
- Flat surfaces, zero shadows; depth comes from four tonal steps and a hairline
- One accent doing real work, plus one strictly bounded secondary
- Monospace with tabular figures wherever numbers are compared
- Wide, heavy display type that reads as an instrument, not a brand flourish
- Motion that enhances an already-complete page and never gates content

## 2. Colors

A near-black field with two warm accents that are never interchangeable, and a red
that is never spent on decoration.

### Primary

- **Scoreboard Lime** (`oklch(0.82 0.21 130)` ≈ `#95dd27`): The live signal. The
  single primary CTA on a screen, the countdown timer, the leading leaderboard row
  and its score bar, and every focus ring. It measures 11.2:1 against the card
  surface, so it carries meaning at small sizes without being enlarged.

### Secondary

- **Award Amber** (`oklch(0.78 0.16 70)` ≈ `#f7a224`): Awards, category badges,
  and secondary honours — and nothing else. It appears as a tinted pill at 10%
  opacity with a 45%-opacity border, never as a fill behind a control.

### Neutral

- **Field Black** (`oklch(0.145 0 0)` ≈ `#0a0a0a`): The page. Also the foreground
  color on both accents, because white on lime is unreadable.
- **Raised Charcoal** (`oklch(0.185 0 0)` ≈ `#131313`): Panels, cards, popovers —
  the first step up from the field.
- **Inset Charcoal** (`oklch(0.24 0 0)` ≈ `#1f1f1f`): Hover and active surfaces,
  bar tracks, secondary buttons. This is what `--accent` holds in shadcn's system.
- **Hairline** (`oklch(0.26 0 0)` ≈ `#242424`): Borders and dividers. Deliberately
  below the 3:1 non-text threshold — it separates without asserting.
- **Dimmed Text** (`oklch(0.68 0 0)` ≈ `#989898`): Supporting copy, captions, and
  rank numbers that are not the leader. 6.9:1 on the field; still AA for body.
- **Full Text** (`oklch(0.985 0 0)` ≈ `#fafafa`): Primary text. 19:1.

### Tertiary

- **Failure Red** (`oklch(0.704 0.191 22.216)` ≈ `#ff6467`): Failed judging runs,
  destructive confirmations, error states.

### Named Rules

**The One Signal Rule.** Scoreboard Lime appears on at most one meaningful element
per viewport. Two lime things on screen means neither is the signal. If a second
element wants emphasis, it gets weight, size or position — not the accent.

**The Amber Boundary Rule.** Award Amber marks honours and never actions. It is
forbidden on any button, link, focus ring, or score. A reviewer who sees amber on
a control should reject the change.

**The Reserved Red Rule.** Failure Red is never used decoratively, never for
emphasis, and never for a "hot" score. With two warm accents already in play, red
is the only thing distinguishing a failed judging run from a winning one, and
spending it elsewhere destroys that distinction.

**The Dark-Foreground Rule.** Both accents sit near lightness 0.8. Any solid fill
built on them takes `Field Black` text, never white. A white-on-lime button is a
defect, not a style choice.

## 3. Typography

**Display Font:** Archivo (variable, `wdth` axis), falling back to `ui-sans-serif, system-ui, sans-serif`
**Body Font:** Archivo, same stack
**Label/Mono Font:** Geist Mono, falling back to `ui-monospace, SFMono-Regular, Menlo, monospace`

**Character:** One grotesk carries the whole interface, pushed to 112% width and
700 weight where it needs to shout. Archivo was drawn for signage and
high-performance print, and at that width it reads like a scoreboard bolted to a
wall rather than a brand wordmark. Geist Mono stays deliberately quiet underneath
it — the display face has the voice, the mono has the facts. Geist Sans was
rejected as the display face precisely because it is the reflexive answer for a
product that cites Vercel as a reference.

### Hierarchy

- **Display** (700, `clamp(2.75rem, 8vw, 5rem)`, 0.98, `-0.03em`, `wdth` 112):
  Hero headlines. One per page, never two. Letter-spacing stops at `-0.03em`,
  above the `-0.04em` floor where letterforms begin to collide.
- **Headline** (700, 1.875rem, 0.98, `-0.03em`, `wdth` 112): Page titles on inner
  screens — sign-in, dashboard, failure states.
- **Title** (500, 0.875rem, 1.4): Panel headers, participant names, the leader row.
- **Body** (400, 1rem, 1.625): Prose. Capped near 58ch; light-on-dark needs the
  extra leading, which is why body sits at 1.625 rather than 1.5.
- **Label** (400, 0.75rem, 1.4): Captions, figure notes, supporting metadata.
- **Numeric** (Geist Mono, tabular figures): Every score, rank, countdown, commit
  SHA and file path. 1.125rem at leaderboard scale, 0.6875rem for sequence markers.

### Named Rules

**The Tabular Figures Rule.** Any number compared against another number is set in
Geist Mono with `tabular-nums`. Proportional digits make a leaderboard visibly
wobble as scores animate, and a wobbling scoreboard reads as unreliable.

**The No Eyebrow Rule.** Small uppercase letter-spaced labels above section
headings are forbidden. The pattern is the single most saturated AI-generated
tell, and this project carried two of them before they were removed. The tagline
appears exactly once, in the wordmark lockup, as brand rather than as a label.

**The Numbered Sequence Rule.** Numbered markers (`01`, `02`) are permitted only
where the order is itself the information — the seven-step product loop qualifies.
Numbering sections because landing pages do that is scaffolding, not voice.

## 4. Elevation

**This system has no shadows.** Not a reduced set, not subtle ones — zero
`box-shadow` declarations exist in the project's own code. Depth is carried
entirely by tonal layering: the page sits at lightness 0.145, panels step up to
0.185, inset surfaces and hover states to 0.24, and a hairline border at 0.26
draws the edge. Cards additionally carry a 10%-opacity white ring at 1px.

This is deliberate. On a near-black field a shadow has almost nothing to darken,
so it reads as a grey smudge rather than as height. Lightness steps do the same
job honestly and survive on OLED panels where a shadow simply disappears.

### Named Rules

**The Flat Field Rule.** Surfaces never lift. If an element needs to separate from
its background, it steps one tonal level or gains a hairline — never a shadow, and
never a glow.

**The Smudge Test.** If a surface looks like it is floating above the page rather
than cut into it, the treatment is wrong. Remove it and step the lightness instead.

## 5. Components

### Buttons

- **Shape:** Gently curved (`0.5rem`), 2.25rem tall at the default size, with
  compact horizontal padding (`0.625rem`).
- **Primary:** Scoreboard Lime fill with Field Black text. One per screen.
- **Hover / Focus:** Hover drops the fill to 80% opacity. Focus-visible draws a
  3px lime ring **with a 2px background-colored offset** — without the offset the
  ring sits flush against a lime button and disappears, which is a real defect
  this system has already hit and fixed.
- **Outline:** Transparent with a hairline border, stepping to Inset Charcoal on
  hover. This is the secondary action, including "Sign in with GitHub".
- **Active:** Translates down 1px. No scale, no bounce.

### Cards / Containers

- **Corner Style:** `0.7rem`, slightly softer than buttons so panels read as
  surfaces and controls read as objects.
- **Background:** Raised Charcoal against the Field Black page.
- **Shadow Strategy:** None. See Elevation.
- **Border:** 1px Hairline, plus a 10% white ring on shadcn cards.
- **Internal Padding:** `1.25rem` horizontal, `0.875rem`–`1rem` vertical for rows.

### Chips

- **Style:** Award Amber text on a 10%-opacity amber fill, with a 45%-opacity
  amber border, fully rounded (`9999px`), `0.6875rem` text.
- **State:** Static. These label an outcome; they are not filters or controls, and
  they carry no hover or pressed state.

### Navigation

- **Style:** A wordmark lockup rather than a nav bar. "VibeJam" in display type at
  1.125rem, with the tagline beside it in mono at 0.75rem on the landing page
  only. Inner pages carry the wordmark alone, with the sign-out control opposite.
- **Mobile:** Unchanged. There is no menu to collapse, which is the point.

### Leaderboard Row

The signature component. A four-column grid — rank, identity, score bar, score —
collapsing to three on narrow screens by dropping the bar, because at phone width
a proportional bar cannot show the difference between 88 and 84 anyway.

- The leader is marked by lime on the rank, the avatar, the bar and the score, plus
  medium weight on the name. **Never by color alone**, and never by dimming the
  others — third place is still someone who shipped.
- The score bar track is fixed-width (`13rem` max), not full-row. A full-row bar
  makes every score look identical, which is decoration pretending to be data.
- Scores count up on load from a server-rendered true value, so the number is
  correct before, during and after the animation.

### Sequence Rail

The product loop. Numbered steps connected by a hairline rule that the mono
numbers punch through with a background-colored mask. Renders as a flow, not as a
grid of cards, because the order is the information.

## 6. Do's and Don'ts

### Do:

- **Do** keep Scoreboard Lime to one meaningful element per viewport. Its rarity
  is what makes it legible.
- **Do** set every comparable number in Geist Mono with `tabular-nums`.
- **Do** give focus rings a 2px offset when they sit on an accent-filled control.
- **Do** use dark text (`oklch(0.145 0 0)`) on any lime or amber fill.
- **Do** carry status in an icon and a word as well as a color — `PASS` and
  `FAIL` must survive red-green color blindness, which the lime-versus-red pairing
  otherwise defeats.
- **Do** step lightness to create depth, and verify contrast per pairing rather
  than assuming it.
- **Do** write animations so the element's natural state is its final state, using
  `backwards` fill. A headless renderer or a hidden tab must still produce a
  complete page.
- **Do** keep body measure near 58ch and leading at 1.625 for light-on-dark.

### Don't:

- **Don't** put Award Amber on a button, link, focus ring, or score.
- **Don't** put a brand color in `--accent`. That token is shadcn's neutral hover
  surface; a brand color there turns every dropdown and menu item bright amber.
- **Don't** spend Failure Red on emphasis or decoration. It is the only signal
  separating a failed judging run from a winning score.
- **Don't** add a `box-shadow`. Anywhere.
- **Don't** put a small uppercase letter-spaced label above a section heading.
- **Don't** number sections that are not sequences.
- **Don't** build a **generic enterprise dashboard** — card grid, sidebar, muted
  blue-grey, every surface equally weighted.
- **Don't** reach for **badge-spam gamification**: streaks, confetti, XP bars,
  achievement toasts. Awards here are earned from rubric evidence.
- **Don't** import **SaaS landing clichés** — the hero-metric template, the
  identical three-card feature grid, the testimonial wall.
- **Don't** render last place in red, greyed out, or shrunk. **Leaderboards that
  humiliate** are an explicit anti-reference.
- **Don't** add a light theme. Dark is the only theme in the MVP.
- **Don't** gate content visibility on a class-triggered transition.
- **Don't** use a full-row progress bar where values must be compared.
