# VibeJam Implementation Plan

Master checklist across all phases. Detailed per-phase plans live in
[`docs/plans/`](plans/). The authoritative specification is
[`VIBEJAM_BUILD_INSTRUCTIONS.md`](../VIBEJAM_BUILD_INSTRUCTIONS.md); section
references below (§) point into it.

**Current position: Phase 1 complete. Phase 2 next.**

---

## Phase 0 — Environment Bootstrap ✅

- [x] Accept the Xcode license (git exited 69 until this was done)
- [x] `git init` on `main`
- [x] `.nvmrc` pinned to the Node version in use (26.3.1)
- [x] Initial commit
- [ ] Create the GitHub remote — **deferred**, needs a name and a
      public/private decision from the project owner. Not required until deploy.

## Phase 1 — Foundation ✅

Plan: [`docs/plans/2026-09-19-phase-1-foundation.md`](plans/2026-09-19-phase-1-foundation.md)

- [x] Next.js 16 + TypeScript (strict) + Tailwind v4 scaffold
- [x] ESLint 9 flat config + Prettier 3, with markdown excluded
- [x] Scripts: `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:e2e`, `format`, `format:check`
- [x] Vitest + React Testing Library + Playwright, `tests/unit` and `tests/e2e` disjoint
- [x] Zod-validated environment config, public eager / server lazy (`lib/env.ts`)
- [x] `.env.example` committed; `.env.local` ignored; verified with `git check-ignore`
- [x] shadcn/ui (`radix-nova`) initialized
- [x] VibeJam dark theme: lime `--primary`, amber `--highlight`, neutral `--accent`
- [x] Archivo (wdth axis) for display, Geist Mono for data
- [x] `PRODUCT.md` — register, users, principles, WCAG 2.2 AA target
- [x] Supabase browser / server / session-refresh clients
- [x] Isolated `createServiceRoleClient`, lazily reading its key, with tests
- [x] `proxy.ts` (Next 16 convention) refreshing the session
- [x] `types/database.ts` — hand-written, `users` only
- [x] Migration structure + `0001_init_users.sql`
- [x] Landing page: hero, product loop, judged-result panel
- [x] README + this plan
- [x] Code review (5 findings; 3 fixed, 2 deferred with owners below)
- [x] Phase 1 completion report

**Carried into Phase 2 as known debt:**

- `0001_init_users.sql` has never been applied to a database (no Docker or
  `psql` available). Parsed against PostgreSQL's grammar only.
- `/login` does not exist; both landing CTAs 404.
- Reduced motion verified structurally, not at runtime.
- Amber is invisible below the `sm` breakpoint.
- **Code review finding (low):** `types/database.ts` Insert requires explicit
  `null` for the nullable `display_name` / `avatar_url`. Disappears when Phase 2
  regenerates the file — do not hand-patch it.
- **Code review finding (medium):** no RLS policy lets a user read a
  co-participant's row. Owned by Phase 5, flagged there.

---

## Phase 2 — Authentication

Acceptance: *User can sign in with GitHub and reach their dashboard.*

- [ ] Create a real Supabase project; fill `.env.local`
- [ ] Apply `0001_init_users.sql` (`supabase db reset`) — **verifies Phase 1 debt**
- [ ] Regenerate `types/database.ts` from the live schema — also clears the
      Insert-type finding from the Phase 1 review
- [ ] Verify the `handle_new_user` trigger fires on metadata change, not just
      insert: sign in, change the GitHub display name, sign in again, confirm
      `public.users` reflects it
- [ ] GitHub OAuth app; credentials into the Supabase dashboard (§29)
- [ ] `/login` page
- [ ] OAuth callback route
- [ ] Logout
- [ ] Profile row created/updated on first login (§26)
- [ ] Route protection in `proxy.ts`
- [ ] `/dashboard`, protected
- [ ] Tests: auth redirects, profile creation, protected-route behavior
- [ ] `/security-review`

## Phase 3 — Jam Creation

Acceptance: *Authenticated user can create a Jam and open its Jam Room.*

- [ ] Migration: `jams` table (§9) with `UNIQUE (invite_code)` and a status CHECK
- [ ] `/jam/new` creation form
- [ ] Invite code generation, unique and unguessable (§27) — TDD
- [ ] Creator permissions
- [ ] Jam list on `/dashboard`
- [ ] Jam Room shell at `/jam/[jamId]`
- [ ] RLS: creator and participants read; creator writes

## Phase 4 — Challenge Generator

> Reordered ahead of participant joining: a Jam only becomes joinable once the
> challenge is locked, so joining could not be demonstrated before this existed.

Acceptance: *Creator can generate, regenerate, save and lock a challenge, and the Jam reaches `waiting`.*

- [ ] Migration: `challenges` table with `jam_id` (§9)
- [ ] Challenge configuration form (category, difficulty, duration, theme, restrictions)
- [ ] OpenAI generation via native structured output; schema from `z.toJSONSchema()`
- [ ] Zod validation with one corrective retry (§13)
- [ ] Regenerate — **updates in place**, never inserts a second row
- [ ] Lock: `draft → waiting`, enforced by trigger and RLS, not just UI
- [ ] Tests: schema validation, retry path, lock rejection after `draft`

## Phase 5 — Participant Joining

Acceptance: *Three different users can join the same Jam in `waiting`; a repeat join is rejected.*

- [ ] Migration: `jam_participants` with `UNIQUE (jam_id, user_id)`
- [ ] `/join/[inviteCode]` page
- [ ] Join action
- [ ] Participant list
- [ ] Duplicate-join prevention at the database, not the application
- [ ] **RLS: co-participants can read each other's public profile fields.**
      Carried from the Phase 1 code review. Without it the participant list and
      the Phase 11 leaderboard silently render one row — RLS filters rather than
      errors, so it will look like a data bug. Needs `jam_participants`, which is
      why it could not be written in Phase 1.

## Phase 6 — Competition Mode

Acceptance: *All participants see the same locked challenge and a synchronized timer.*

- [ ] Start Jam: `waiting → active`, sets `started_at`
- [ ] Bulk transition of all participants `joined → building` (§7)
- [ ] Countdown computed from `started_at + duration` — TDD
- [ ] Server time sent with the page so clocks cannot drift apart (§28)
- [ ] Status transitions guarded against invalid moves
- [ ] Challenge display

## Phase 7 — Submission System

Acceptance: *Every participant can submit one repository and the exact commit SHA is stored.*

- [ ] Migration: `submissions` with `UNIQUE (jam_id, user_id)` and `analysis_status`
- [ ] Repository URL parsing and validation — TDD
- [ ] Reject private repositories with a clear explanation (§16)
- [ ] Resolve and store the exact commit SHA
- [ ] Optional demo URL
- [ ] **Server-side deadline re-check** on every submission (§28)
- [ ] RLS: own row only while the Jam is active
- [ ] Test proving participant B cannot read participant A's submission mid-Jam
- [ ] `/security-review`

## Phase 8 — Repository Analyzer

Acceptance: *The backend can produce a structured repository analysis for a valid submission.*

- [ ] `GITHUB_TOKEN` wired; Octokit client behind an injectable seam
- [ ] Repository metadata, tree retrieval at the stored SHA
- [ ] Deterministic file selection (§17) — TDD
- [ ] Ignore list, file-size and repository-size limits
- [ ] Named token-budget constants, enforced before the call (§12)
- [ ] Structured repository summary → `analysis_json`
- [ ] Error handling: rate limit, too large, inaccessible

## Phase 9 — AI Judge

Acceptance: *A repository can receive a complete valid score and detailed feedback.*

- [ ] Migration: `scores` with `UNIQUE (submission_id)` and per-category CHECKs
- [ ] Separate prompts per stage (§38)
- [ ] Requirement verification → PASS / PARTIAL / FAIL with file evidence
- [ ] Rubric scoring, each category independent
- [ ] Zod schemas; retry once on violation
- [ ] Out-of-range scores clamped, logged, and marked in `feedback_json` (§10)
- [ ] **Total calculated in application code**, never taken from the model — TDD
- [ ] `judge_model` recorded
- [ ] `/security-review`

## Phase 10 — Multi-Project Judging

Acceptance: *A completed Jam with three submissions produces three scored results.*

- [ ] Migration: `jam_results` (awards + cross-project comparison)
- [ ] One submission per request; `maxDuration` set and confirmed against the plan
- [ ] Status claiming (`pending → analyzing`) to prevent duplicate judging
- [ ] Client polling drives progress
- [ ] Per-submission failure recovery; one bad repo must not block the Jam
- [ ] Stage 5 cross-project comparison, once, after all submissions settle
- [ ] Awards derived from rubric evidence (§22)
- [ ] `judging → completed`

## Phase 11 — Results

Acceptance: *Users can understand why each project received its score.*

- [ ] `/jam/[jamId]/results`
- [ ] Leaderboard with correct ordering
- [ ] Category breakdown table
- [ ] Per-requirement feedback with file evidence
- [ ] Awards
- [ ] Repository and demo links, revealed only now
- [ ] Public read when the Jam is `completed` (§3 shareable results)
- [ ] Results read from storage; never re-judged on view (§37)

## Phase 12 — Head-to-Head Comparison

Acceptance: *Users can compare two submissions and understand the differences.*

- [ ] `/jam/[jamId]/compare`
- [ ] Select two participants
- [ ] Score and strength comparison
- [ ] AI-generated "what each can learn from the other" (§23)
- [ ] Pair results cached into `comparison_json`; never generated twice

## Phase 13 — Testing and Hardening

- [ ] Test-only auth seam: seed three users, inject sessions (§33)
- [ ] Full Playwright flow: login → create → join → generate → start → submit → judge → results
- [ ] Unit coverage: scoring, timers, invite codes, repo parsing, state transitions, schema validation
- [ ] Authorization tests for every RLS rule
- [ ] Error-path coverage (§34)
- [ ] Deploy to Vercel
- [ ] Final `/security-review`

---

## Definition of Done (§45)

The MVP is complete when three users can run one Jam start to finish: sign in,
create, invite, join, generate and lock a challenge, build, submit repositories
with exact commit SHAs, have all submissions analyzed and scored, view a
leaderboard with awards and per-requirement feedback, compare head-to-head, and
revisit the results later — deployed on Vercel.
