# VibeJam — Complete Build Instructions for Claude

> **Revision — 2026-09-19.** This document was audited before Phase 1 and amended.
> Changes are marked inline. Summary:
>
> - Added **§4.1 Skills and Working Agreement** — which installed skills apply, and
>   how six of them are reconciled where they conflict with this document.
> - Added **Phase 0** (§32) — `git` is unusable on this machine and no repository
>   exists yet. Both block §44.
> - **§9 schema**: added `jam_results` (awards and cross-project comparison had
>   nowhere to be stored), `submissions.analysis_status` (no way to prevent
>   duplicate judging), missing unique constraints, `challenges.jam_id`, and the
>   `users.id ↔ auth.users.id` rule that every RLS policy depends on.
> - **§12**: added judging orchestration. The pipeline as written cannot complete
>   inside one serverless request.
> - **§16**: submitted repositories must be public, and reads need a server-side
>   PAT. Supabase does not persist the OAuth token needed for private repos, and
>   unauthenticated GitHub reads run out of rate limit within one Jam.
> - **§25**: RLS policies specified per table, plus a service-role-key usage rule.
>   Repository visibility (§15) is a database rule, not a UI rule.
> - **§28**: the server, not the browser, enforces the deadline.
> - **§29**: `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` removed (they live in
>   Supabase, not in the app); `GITHUB_TOKEN` added.
> - **§32**: Phases 4 and 5 swapped — the old Phase 4 acceptance criterion was
>   unreachable. Phase 1 now lists the npm scripts §43 assumes exist.
> - **§33**: named the auth and external-client seams the Phase 13 E2E flow needs.

## 1. Project Overview

You are building a new project called **VibeJam**.

VibeJam is an online vibe-coding competition platform where multiple participants receive the same coding challenge, build their own solution independently, submit a GitHub repository, and then have their projects evaluated using a structured AI-assisted judging system.

The core product loop is:

```text
Create Jam
   ↓
Generate Challenge
   ↓
Invite Friends
   ↓
Lock Challenge
   ↓
Participants Build Independently
   ↓
Submit GitHub Repositories
   ↓
Analyze Repositories
   ↓
AI Judges Each Project
   ↓
Leaderboard
   ↓
Detailed Comparison
```

The MVP objective is simple:

> Three users should be able to complete one entire VibeJam competition from Jam creation through final results.

Do not overbuild the platform beyond this MVP.

---

# 2. Product Goal

VibeJam should make small coding competitions easy and fun.

A user should be able to:

1. Sign in with GitHub.
2. Create a Jam.
3. Configure and generate a coding challenge.
4. Invite friends with a shareable link.
5. Lock the challenge.
6. Start the competition.
7. Build independently.
8. Submit a GitHub repository.
9. Optionally submit a live demo URL.
10. Have all submissions analyzed against the same rubric.
11. View a leaderboard.
12. View detailed AI feedback.
13. Compare submissions head-to-head.
14. Share the final results page.

The system should emphasize both competition and learning.

---

# 3. MVP Scope

## Must Have

- GitHub authentication
- User account/profile basics
- Create Jam
- Invite participants
- Join Jam by link/code
- AI-generated challenge
- Challenge regeneration before lock
- Lock challenge
- Start Jam
- Build timer
- Participant status
- GitHub repository submission
- Optional live demo URL
- Store exact submitted commit SHA
- GitHub repository analysis
- Structured AI judging
- Fixed scoring rubric
- Leaderboard
- Detailed score breakdown
- Head-to-head comparison
- Category awards
- Shareable results page
- Basic error handling
- Basic automated testing
- Vercel deployment support

## Do Not Build in MVP

Do not implement these unless explicitly asked later:

- Public global profiles
- Global leaderboard
- Weekly public competitions
- Payments
- Chat
- Comments
- Community voting
- Tournament brackets
- Teams
- Browser-agent judging
- Running submitted code
- Docker sandbox execution
- Automatic deployments of submissions
- Mobile apps
- Native apps
- Complex notification systems
- Social feeds
- Organization accounts
- Paid plans

---

# 4. Recommended Tech Stack

Use this stack unless there is a strong technical reason not to.

## Application

- Next.js (latest stable — verify the actual version with `npx create-next-app@latest` at scaffold time and record it in the README; do not assume a version number)
- React
- TypeScript (strict mode on)
- Node.js: use the version in `.nvmrc`; must satisfy the Next.js requirement

## Package Manager

Use **npm**. Declare it in `package.json`:

```json
"packageManager": "npm@<version>"
```

This matters: the `shadcn` skill dispatches on `packageManager`, and a mismatch produces the wrong CLI invocations.

## Styling

- Tailwind CSS
- shadcn/ui

## Hosting

- Vercel

## Database

- Supabase PostgreSQL

## Authentication

- Supabase Auth
- GitHub OAuth

## GitHub Integration

- GitHub REST API
- Octokit

## AI

- OpenAI API (as specified by the project owner)
- Use the provider's **native structured-output mode** (JSON Schema / `response_format`), not free-text JSON parsing
- Derive the JSON Schema from the Zod schema (e.g. `zod-to-json-schema`) so there is exactly one source of truth per AI call

Rationale: §13 requires Zod validation of every AI response. Native structured output makes schema violations rare instead of routine, which keeps the retry path (§13) an exception rather than the norm.

## Validation

- Zod

## Testing

- Vitest
- React Testing Library
- Playwright

## Code Quality

- ESLint
- Prettier

Avoid microservices.

Prefer a single Next.js application with server-side API routes / server actions where appropriate.

---

# 4.1 Skills and Working Agreement

This machine has skills installed that change *how* the work is done. Where a skill
conflicts with this document, the resolution below wins — do not silently pick one.

## Always apply

| Skill | Applies to |
|---|---|
| `karpathy-guidelines` | Every coding turn. Reinforces §42. Surgical changes, no speculative abstraction, state assumptions. |
| `verification-before-completion` | Every completion claim, every phase report (§43, §47). |
| `systematic-debugging` | Every bug, test failure, or unexpected behavior. Root cause before fix — no exceptions. |
| `vercel-react-best-practices` | Every React/Next.js file written or refactored (§37). |

## Apply per situation

| Skill | Applies to |
|---|---|
| `test-driven-development` | The TDD loop for logic code. See "TDD scope" below. |
| `tdd` | Test *design* guidance: test behavior through public interfaces, not internals. Use alongside, not instead of, the above. |
| `writing-plans` | Producing the per-phase plan before a phase starts. |
| `requesting-code-review` / `receiving-code-review` | End of every phase, before the phase report. |
| `shadcn` | All shadcn/ui component work (§4, §24). |
| `ui-ux-pro-max` | Start of a UI-heavy phase (Phases 3, 6, 11, 12) — layout, palette, typography decisions. |
| `impeccable` | Polish passes on a screen that already works. Never before it works. |
| `webapp-testing` | Ad-hoc interactive browser debugging only. See "E2E conflict" below. |
| `finishing-a-development-branch` | Only at MVP completion (§45). |
| `/security-review` | Before any deploy, and at the end of Phases 2, 7, and 9 (§25). |
| `/code-review` | Cheap per-phase pass in addition to the review subagent. |

## Not applicable to this project

`pdf`, `pptx`, `xlsx`, `slides`, `banner-design`, `brand`, `design`, `design-system`,
`watch-video`, `humanizer`, `apple-design` (mobile/desktop native, not web).
`agent-browser` is V0.2 territory (live demo inspection, §41) — not MVP.

## Conflict resolutions

### 1. `brainstorming` HARD-GATE vs. this document

The `brainstorming` skill forbids implementation before a design is presented and
approved. **This document is that approved design for the MVP scope defined in §3.**
Do not re-run brainstorming per phase — it would stall every phase on questions this
document already answers.

Do invoke `brainstorming` when, and only when:
- a genuinely new feature outside §3 is requested, or
- a phase surfaces a design decision this document does not cover and the choice is
  not obviously resolvable by §50.

### 2. `test-driven-development` Iron Law vs. the phase plan

The Iron Law ("no production code without a failing test first") cannot apply to
project scaffolding, config files, or SQL migrations. Scope it explicitly:

**TDD is mandatory for** everything under `lib/`:
- `lib/scoring/**` — rubric arithmetic, clamping, totals
- `lib/github/**` — URL parsing, owner/repo extraction, file filtering
- `lib/validation/**` — Zod schemas, AI response validation
- timer/remaining-time calculation
- invite code generation and collision handling
- Jam and participant state-transition guards

**TDD is not required for** `create-next-app` scaffolding, `tailwind.config`,
`eslint.config`, SQL migrations, purely presentational components, or
`.env.example`. Cover these with component tests and E2E instead.

This supersedes the blanket "Always" list in the `test-driven-development` skill,
per that skill's own rule that user instructions take precedence.

### 3. `writing-plans` output location vs. §31

Both exist, with different jobs:
- `docs/IMPLEMENTATION_PLAN.md` — the **master checklist** across all 13 phases. Always current. This is §31.
- `docs/plans/YYYY-MM-DD-phase-N-<name>.md` — the **detailed per-phase plan** produced by `writing-plans` immediately before starting that phase.

Do not use the skill's default `docs/superpowers/plans/` path.

### 4. `webapp-testing` (Python Playwright) vs. §4 / §33 (TypeScript Playwright)

Committed E2E tests use **`@playwright/test` in TypeScript**, in `tests/e2e/`. They
are what CI runs. The `webapp-testing` skill writes throwaway Python scripts — use it
only for interactive debugging, and never commit its output.

### 5. Subagents (`subagent-driven-development`, `dispatching-parallel-agents`, `requesting-code-review`)

These dispatch subagents via the Agent tool. **Ask the project owner before the first
subagent dispatch of a session.** Once approved for a phase, that approval covers
that phase. If subagents are declined, fall back to `executing-plans` and run
`/code-review` in-session instead of a reviewer subagent.

### 6. `using-git-worktrees`

Not used for Phases 1–13: this is a single-developer greenfield MVP built
sequentially on one branch. Revisit only if parallel feature work starts.

---

# 5. Core Product Terminology

## Jam

A competition created by one user.

A Jam contains:

- challenge
- creator
- participants
- build duration
- status
- submissions
- scores
- results

## Participant

A user who joins the Jam.

## Challenge

The shared coding task that all participants receive.

## Submission

A GitHub repository submitted by a participant.

## Judge

The AI-assisted evaluation process that analyzes submissions using the fixed rubric.

---

# 6. Jam Lifecycle

A Jam should move through these states:

```text
draft
waiting
active
judging
completed
```

Meaning:

### draft

Creator is configuring the Jam and challenge.

### waiting

Challenge is locked and participants are joining.

### active

Competition has started.

### judging

Submissions are closed and analysis is running.

### completed

Results are available.

Do not allow invalid state transitions.

---

# 7. Participant Lifecycle

Participant status:

```text
joined
building
submitted
```

Transitions:

- `joined` — set on join, while the Jam is in `waiting`
- `joined -> building` — set for **all** participants at the moment the creator
  starts the Jam (`waiting -> active`). This is a single bulk update, not a
  per-user action.
- `building -> submitted` — set when that participant's submission is accepted

There is no `late` status in MVP. §28 blocks submissions after expiry.

Participants should not be able to see each other's repository links while the Jam is active.

Once judging begins, submitted repositories can be revealed.

This is a **database-level** rule, not a UI rule. See §25.

---

# 8. Recommended Repository Structure

Create approximately this structure:

```text
vibejam/
│
├── app/
│   ├── page.tsx
│   │
│   ├── login/
│   │   └── page.tsx
│   │
│   ├── dashboard/
│   │   └── page.tsx
│   │
│   ├── jam/
│   │   ├── new/
│   │   │   └── page.tsx
│   │   │
│   │   └── [jamId]/
│   │       ├── page.tsx
│   │       ├── submit/
│   │       │   └── page.tsx
│   │       ├── results/
│   │       │   └── page.tsx
│   │       └── compare/
│   │           └── page.tsx
│   │
│   ├── join/
│   │   └── [inviteCode]/
│   │       └── page.tsx
│   │
│   └── api/
│       ├── challenges/
│       ├── jams/
│       ├── submissions/
│       ├── github/
│       └── judging/
│
├── components/
│   ├── challenge/
│   ├── jam/
│   ├── judging/
│   ├── leaderboard/
│   └── ui/
│
├── lib/
│   ├── ai/
│   │   ├── challenge-generator.ts
│   │   ├── repository-summary.ts
│   │   ├── judge.ts
│   │   └── prompts.ts
│   │
│   ├── github/
│   │   ├── client.ts
│   │   ├── repository-reader.ts
│   │   └── repository-parser.ts
│   │
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   │
│   ├── scoring/
│   │   └── rubric.ts
│   │
│   └── validation/
│
├── types/
│
├── supabase/
│   └── migrations/
│
├── tests/
│   ├── unit/
│   └── e2e/
│
├── docs/
│   ├── IMPLEMENTATION_PLAN.md
│   └── plans/                 # per-phase plans (§31)
│
├── public/
│
├── .env.example
├── README.md
├── CONTRIBUTING.md
└── package.json
```

This is guidance, not a rigid constraint.

Prefer a clear structure over unnecessary abstraction.

---

# 9. Database Schema

Use Supabase PostgreSQL.

Create migrations instead of manually changing production tables.

## users

```text
id                 -- uuid PK, REFERENCES auth.users(id) ON DELETE CASCADE
github_id
github_username
display_name
avatar_url
created_at
updated_at
```

`users.id` **must** be the same uuid as `auth.users.id`. Every RLS policy in this
document is written in terms of `auth.uid()`, and they only work if this holds.
Populate the row on first login via a trigger on `auth.users` or in the auth
callback (§26).

## jams

```text
id
creator_id                 -- REFERENCES users(id)
name
invite_code                -- UNIQUE index required (§27)
status                     -- draft | waiting | active | judging | completed
challenge_id               -- nullable until a challenge is generated
build_duration_minutes
judge_model                -- model identifier used for judging this jam (§39)
created_at
updated_at
started_at
completed_at
```

Constraints:
- `UNIQUE (invite_code)`
- `CHECK (status IN ('draft','waiting','active','judging','completed'))`
- `judge_model` is written once when judging starts and never changed. It makes a
  result explainable and reproducible, and it is what §39 means by "the same judging
  model configuration".

## challenges

```text
id
jam_id                     -- REFERENCES jams(id) ON DELETE CASCADE
title
description
difficulty
category
requirements               -- jsonb
restrictions               -- jsonb
bonus_objectives           -- jsonb
generated_prompt
created_at
```

Use JSONB for:

- requirements
- restrictions
- bonus_objectives

### Regeneration rule (§14)

Regenerating a challenge **replaces the row in place** (`UPDATE`), it does not
insert a new one. Rationale: `jams.challenge_id` points at exactly one challenge,
and inserting on every regenerate leaves orphan rows with no owner and no cleanup
path. A creator may regenerate any number of times while `jams.status = 'draft'`.

### Lock rule (§15)

There is no `is_locked` column. **Lock state is derived**: the challenge is locked
exactly when `jams.status != 'draft'`. Enforce it with an RLS policy plus a trigger
that rejects any `UPDATE` to a challenge whose jam has left `draft`. A single
source of truth for lock state avoids the two fields disagreeing.

## jam_participants

```text
id
jam_id
user_id
status                     -- joined | building | submitted
joined_at
submitted_at
```

Enforce uniqueness for:

```text
jam_id + user_id
```

`UNIQUE (jam_id, user_id)` is a database constraint, not an application check.
It is the only thing that actually prevents a double-join under a race (§27).

## submissions

```text
id
jam_id
user_id
repo_url
repo_owner
repo_name
demo_url
commit_sha
analysis_json              -- Stage 1 repository summary
requirements_json          -- Stage 2 requirement verification results
analysis_status            -- pending | analyzing | judging | complete | failed
analysis_error             -- user-safe error message, null on success
submitted_at
created_at
```

Constraints:
- `UNIQUE (jam_id, user_id)` — one submission per participant per Jam (§15). Again,
  a DB constraint, not an application check.
- `CHECK (analysis_status IN ('pending','analyzing','judging','complete','failed'))`

The `commit_sha` is critical.

The system must judge the exact submitted version rather than whatever exists later on the repository's default branch.

`analysis_status` is what makes "prevent duplicate judging" (§32 Phase 10) and
failure recovery possible. Without it there is nowhere to record that a submission
is mid-judging, and a second request would re-run and re-bill the whole pipeline.
Stage 2 output is stored separately from Stage 1 so a rubric retry does not require
re-fetching the repository.

## scores

```text
id
submission_id              -- UNIQUE
requirements_score
functionality_score
ux_score
code_quality_score
creativity_score
architecture_score
documentation_score
total_score
feedback_json
judge_model
created_at
```

Constraints:
- `UNIQUE (submission_id)` — a submission has exactly one score. Re-judging updates
  the row; it does not append a second one that the leaderboard would then have to
  disambiguate.
- A `CHECK` per category bounding it to `0 .. max` from the §10 rubric.

## jam_results

```text
id
jam_id                     -- UNIQUE
awards_json                -- §22
comparison_json            -- §12 Stage 5 cross-project analysis
generated_at
judge_model
created_at
```

This table is required. §12 Stage 5, §22 and §23 all produce AI output that has
nowhere else to live, and §37 requires that "completed analysis is stored so results
can be revisited without re-judging". Without this table, every visit to
`/jam/[id]/results` would re-run cross-project comparison — non-deterministic output
and a fresh API bill on each page view.

Head-to-head pairs (§23) are generated on demand and cached into `comparison_json`
keyed by the participant pair, so the same pair is never generated twice.

---

# 10. Scoring Rubric

Use this fixed rubric for MVP:

| Category | Maximum |
|---|---:|
| Requirements | 25 |
| Functionality | 20 |
| UI / UX | 15 |
| Code Quality | 15 |
| Creativity | 10 |
| Architecture | 10 |
| Documentation | 5 |
| **Total** | **100** |

The AI must score each category independently.

The application must calculate the total score.

Do not trust the model to calculate the final total.

## Out-of-range scores

If a returned category score is outside `0 .. max`, treat it as a schema violation:
retry once with a correction message (§13). If the retry is still out of range,
**clamp to the bound, log the original value, and mark the score as clamped in
`feedback_json`.** Never persist a raw out-of-range value and never let one
propagate into `total_score` — an inflated category silently corrupts the
leaderboard, which is the one output users actually judge the product by.

---

# 11. AI Judging Philosophy

Do not send a repository to an AI model and simply ask:

> Give this project a score from 1 to 100.

That is not acceptable.

Judging must be evidence-based.

The system should ask questions such as:

> Does this implementation satisfy Requirement #1?

The response should cite specific files and relevant implementation evidence.

Example structured format:

```json
{
  "requirement": "Persist previous comparisons",
  "status": "PASS",
  "reason": "The application stores completed comparisons in browser storage.",
  "evidence": [
    {
      "file": "src/lib/storage.ts",
      "reason": "Contains persistence logic."
    }
  ]
}
```

Allowed statuses:

```text
PASS
PARTIAL
FAIL
```

---

# 12. Judging Pipeline

Use multiple stages rather than one giant AI prompt.

## Stage 1 — Repository Inspection

Retrieve:

- repository metadata
- file tree
- important source files
- README
- package configuration
- test files
- VIBEJAM.md if present

Generate a structured repository summary.

## Stage 2 — Requirement Verification

Evaluate each challenge requirement separately.

Return:

- PASS
- PARTIAL
- FAIL
- explanation
- evidence files

## Stage 3 — Rubric Evaluation

Score:

- requirements
- functionality
- UI/UX
- code quality
- creativity
- architecture
- documentation

Each category must have:

- numeric score
- maximum score
- explanation
- evidence

## Stage 4 — Score Calculation

Application code validates the values and calculates:

```text
total_score =
requirements
+ functionality
+ ux
+ code_quality
+ creativity
+ architecture
+ documentation
```

## Stage 5 — Cross-Project Comparison

After every project has its individual score:

Compare all submissions.

Generate:

- category leaders
- strengths
- weaknesses
- awards
- learning opportunities
- head-to-head comparison

This stage must not change previously generated individual scores.

## Orchestration and Timeouts

The five stages above will not fit in one serverless request. A single submission is
several sequential AI calls plus a dozen GitHub calls; three submissions is a
multi-minute job. Vercel serverless functions have a hard wall-clock limit.

Required design:

1. **One submission per request.** A judging request advances exactly one submission
   through Stages 1–4 and returns. It never loops over all submissions.
2. **Set `export const maxDuration`** on the judging route to the highest value the
   target Vercel plan allows, and confirm that number against the plan before
   relying on it — do not assume.
3. **Drive progress from `submissions.analysis_status`.** A request claims work with
   a conditional update (`pending -> analyzing`) so two concurrent requests cannot
   claim the same submission. This is the duplicate-judging guard from §32 Phase 10.
4. **The client polls** jam judging progress and triggers the next pending
   submission. The Jam Room / results page shows per-participant progress.
5. **Stage 5 runs only once**, after every submission in the Jam reaches `complete`
   or `failed`, and writes `jam_results`.
6. **Failures are recoverable.** A submission that fails sets `analysis_status =
   'failed'` with a user-safe `analysis_error`, and the creator can retry just that
   one. One bad repository must not block the Jam's results.
7. **The Jam transitions to `completed`** when `jam_results` exists. If some
   submissions failed, show the leaderboard with those participants marked
   unjudged rather than blocking the page.

Do not introduce a queue service, a cron worker, or a separate backend for this.
Polling plus a status column is sufficient for three participants and is the
simplest thing that satisfies §42.3.

## Cost Ceiling

§17 requires a "total analysis token budget" but never binds it to a number. Define
the budget as named constants in `lib/ai/` — per-submission input token cap,
per-file byte cap, and max files analyzed — and enforce them before the call, not
after. Log actual token usage per stage (§35). A runaway repository must fail the
budget check rather than produce a surprise bill.

---

# 13. Structured AI Output

Use Zod schemas for every AI response.

Example conceptual response:

```json
{
  "requirements": [
    {
      "requirement": "Allow users to enter two options",
      "status": "PASS",
      "reason": "Implemented in the main comparison form.",
      "evidence": [
        {
          "file": "src/components/ComparisonForm.tsx",
          "reason": "Contains both option input fields."
        }
      ]
    }
  ],
  "scores": {
    "requirements": {
      "score": 23,
      "max": 25,
      "reason": "Most requirements are fully implemented."
    },
    "functionality": {
      "score": 18,
      "max": 20,
      "reason": "Core functionality works, but validation is limited."
    }
  }
}
```

If output validation fails:

- retry with correction instructions
- do not persist malformed data
- surface a useful error if retries fail

---

# 14. AI Challenge Generator

The Jam creator should configure:

```text
category
difficulty
buildDuration
theme
technologyRestrictions
```

## Suggested categories

- Productivity
- Finance
- Games
- AI
- Social
- Utilities
- Data Visualization
- Developer Tools
- Random

## Difficulty

```text
Beginner
Intermediate
Advanced
```

AI challenge generation must return structured JSON.

Example:

```json
{
  "title": "Decision Engine",
  "description": "Build an app that helps users compare two decisions.",
  "requirements": [
    "Allow users to enter two options",
    "Ask at least three contextual questions",
    "Generate weighted scores",
    "Explain the recommendation",
    "Persist previous comparisons"
  ],
  "restrictions": [
    "Must work on mobile",
    "No prebuilt decision-making libraries"
  ],
  "bonusObjectives": [
    "Visualize decision factors"
  ]
}
```

The user may regenerate the challenge before it is locked.

Once locked, the challenge cannot be changed.

---

# 15. Competition Rules

## Challenge Locking

Once the Jam starts:

- challenge cannot change
- requirements cannot change
- restrictions cannot change
- build duration cannot change

## Repository Visibility

During active competition:

- Participant A cannot see Participant B's repo
- Participant B cannot see Participant C's repo
- repository links remain private

After submissions are closed:

- repositories may be shown

## Submission Locking

When a submission is accepted:

Store:

- GitHub repository URL
- repository owner
- repository name
- exact commit SHA
- timestamp
- optional demo URL

Judging should use the stored commit SHA.

---

# 16. GitHub Integration

Use the GitHub API.

Do not execute submitted repositories.

## Repository Access: submitted repos must be public

This is a required MVP constraint, and it resolves a real problem rather than being
a simplification for its own sake.

Reading a *private* repository requires the submitter's GitHub token. Supabase Auth
returns a GitHub `provider_token` only at the moment of sign-in and does not persist
it. Judging happens hours later, when that token is long gone. There is no
MVP-scoped way to read a participant's private repository.

Therefore:
- **Submissions must be public repositories.** Validate this at submission time
  (§19 `/jam/[id]/submit`) and reject a private repo with a clear message explaining
  why, before the participant believes they have submitted.
- Say so on the submission screen and in the Jam Room, not only in the error.
- Private repository support is out of MVP scope. It needs a GitHub App
  installation, which belongs in §41.

## Server-side token

Use a **server-side GitHub Personal Access Token** (`GITHUB_TOKEN`, §29) for all
repository reads. Unauthenticated GitHub API access is limited to roughly 60
requests per hour — a single Jam with three submissions (tree + metadata + many file
reads each) exceeds that immediately, and judging would fail on rate limits rather
than on anything to do with the code. An authenticated token raises the ceiling far
above what a Jam needs.

The token needs only public read access. It is never sent to the browser.

## Retrieve

- repository information
- default branch
- exact submitted commit
- file tree
- selected source files
- README
- package metadata
- tests

## Important Files

Prioritize:

```text
README.md
VIBEJAM.md
package.json
requirements.txt
pyproject.toml
src/**
app/**
components/**
pages/**
routes/**
lib/**
tests/**
```

## Ignore

Do not spend AI tokens on:

```text
node_modules
dist
build
.next
coverage
vendor
binary assets
large images
generated files
lock files unless useful
```

Implement sensible file-size and repository-size limits.

Do not send entire large repositories blindly to the model.

---

# 17. Repository Analysis Strategy

Create a deterministic selection strategy.

Example:

1. Retrieve tree.
2. Identify framework.
3. Find entry points.
4. Find main application directories.
5. Find relevant implementation files.
6. Find test files.
7. Find README / VIBEJAM.md.
8. Enforce max file size.
9. Enforce total analysis token budget.
10. Summarize code before judging where appropriate.

Prefer source files most relevant to challenge requirements.

---

# 18. VIBEJAM.md Submission Standard

Encourage participants to include a `VIBEJAM.md` file.

Template:

```markdown
# Project Name

## Project Description

## How to Run

## Features Completed

## Bonus Features

## Tech Stack

## Architecture

## Known Limitations

## AI Tools Used
```

A project may still be judged without this file.

However, missing documentation can affect the documentation score.

---

# 19. Main Screens

Build these screens.

## `/`

Landing page.

Purpose:

- explain VibeJam
- show basic flow
- CTA: Start a Jam
- CTA: Sign in with GitHub

## `/login`

GitHub authentication.

## `/dashboard`

Show:

- Jams created by user
- Jams joined by user
- status
- dates
- create new Jam CTA

## `/jam/new`

Jam creation form.

Fields:

- Jam name
- category
- difficulty
- build duration
- theme
- optional tech restrictions

Generate challenge.

Allow regenerate.

Allow lock.

## `/join/[inviteCode]`

Invite page.

Show:

- Jam name
- creator
- challenge status
- participant count

Allow logged-in user to join.

## `/jam/[id]`

Jam Room.

Show:

- title
- challenge
- requirements
- restrictions
- countdown
- participant list
- participant statuses
- submit CTA
- Jam status

## `/jam/[id]/submit`

Submission page.

Fields:

- GitHub repository URL
- optional demo URL

Validate repository.

Confirm exact commit SHA before submission.

## `/jam/[id]/results`

Results page.

Show:

- leaderboard
- total scores
- category breakdown
- AI feedback
- awards
- links to submissions

## `/jam/[id]/compare`

Head-to-head comparison page.

Allow selecting two submissions.

---

# 20. Jam Room UI

The Jam Room is a key screen.

Conceptual structure:

```text
VIBEJAM #127
Decision Engine

02:31:44 remaining

Participants

Chinmay
● Building

Alex
✓ Submitted

Sam
● Building

Challenge
--------------------------------

Build an application that...

Requirements
✓ Requirement one
✓ Requirement two
✓ Requirement three

Restrictions
- Mobile responsive
- No prebuilt decision library

[ Submit Project ]
```

Do not expose submitted repository URLs until submissions close.

---

# 21. Results Page

Example:

```text
VIBEJAM #001

1. Chinmay — 88
2. Alex — 84
3. Sam — 76
```

Detailed category comparison:

| Category | Chinmay | Alex | Sam |
|---|---:|---:|---:|
| Requirements | 24 | 22 | 20 |
| Functionality | 18 | 18 | 16 |
| UI / UX | 14 | 11 | 13 |
| Code Quality | 12 | 14 | 11 |
| Creativity | 9 | 8 | 8 |
| Architecture | 7 | 8 | 5 |
| Documentation | 4 | 3 | 3 |

---

# 22. Awards

Generate optional awards after judging.

Suggested awards:

- Overall Winner
- Best UI
- Best Architecture
- Cleanest Code
- Most Creative
- Best Extra Feature
- Best Documentation

Awards should be based on actual score/evidence data.

Do not invent awards that contradict the rubric results.

---

# 23. Head-to-Head Comparison

Example:

```text
Chinmay
88

VS

Alex
84
```

Show:

## Chinmay strengths

- UI / UX
- Creativity
- Requirement coverage

## Alex strengths

- Architecture
- Code quality

Then generate:

### What Chinmay can learn from Alex

Explain useful patterns or design decisions from Alex's solution.

### What Alex can learn from Chinmay

Explain useful patterns or design decisions from Chinmay's solution.

This is an important learning feature.

---

# 24. UI Design Direction

The interface should feel like:

```text
GitHub
+
Linear
+
Vercel
+
Gaming leaderboard
```

Avoid a generic enterprise dashboard appearance.

## Style

- dark theme by default
- charcoal / near-black background
- modern clean typography
- high contrast
- subtle borders
- restrained accent color
- monospace accents for code-related information
- large countdown timer
- participant avatars
- strong leaderboard presentation
- simple animations
- responsive layout

## Brand

Name:

```text
VibeJam
```

Suggested tagline:

```text
Build. Compete. Ship.
```

Do not over-design the first version.

Functionality comes first.

---

# 25. Security Requirements

Security is important.

Never expose these to the browser:

```text
OPENAI_API_KEY
SUPABASE_SERVICE_ROLE_KEY
GITHUB_CLIENT_SECRET
OAuth secrets
```

AI requests must happen server-side.

Authenticated GitHub API requests requiring secrets must happen server-side.

## Key usage

This matters more than any individual policy: RLS is worthless if the service-role
key is used everywhere.

- **Anon key + the user's session** for every user-scoped read and write. These go
  through RLS.
- **Service-role key only** in the judging pipeline (§12), which legitimately needs
  to read all submissions in a Jam and write scores on behalf of no one.
- Never import the service-role client from a module that also serves user
  requests. Keep it in a separate file with a name that makes misuse obvious.

## Row Level Security

Implement Supabase Row Level Security. These are the required policies, not
examples:

| Table | Rule |
|---|---|
| `users` | A user reads and updates only their own row. Public profile fields of co-participants are readable within a shared Jam. |
| `jams` | Readable by the creator and by participants. Also readable by anyone when `status = 'completed'` (this is what makes §3's "shareable results page" work). Writable only by the creator. |
| `challenges` | Readable by anyone who can read the parent Jam. Writable by the creator, and only while the Jam is in `draft`. |
| `jam_participants` | Readable by anyone in the same Jam. A user may insert only their own row. |
| `submissions` | **While `jams.status` is `draft`, `waiting` or `active`: a participant reads only their own row.** Once the Jam is `judging` or `completed`, all participants read all rows in that Jam; when `completed`, anyone may read them. Insert/update only own row, only while the Jam is `active`. |
| `scores` | Readable when the parent Jam is `judging` or `completed`. Never writable by a user — service role only. |
| `jam_results` | Readable when the parent Jam is `completed`. Service role writes only. |

The `submissions` policy is the one that enforces §15's repository-visibility rule.
Hiding repo URLs in the UI is not an implementation of that rule — a participant can
read the API directly. Write the policy, then write a test that proves participant B
cannot read participant A's row during an active Jam.

Do not execute submitted code.

Never run commands such as:

```bash
npm install
npm run dev
npm test
pip install -r requirements.txt
python app.py
```

against a participant repository.

Executing arbitrary repository code is explicitly outside MVP scope.

---

# 26. Authentication

Use GitHub OAuth through Supabase Auth.

On first login:

Create/update user profile using:

- GitHub ID
- username
- display name
- avatar

Protect authenticated routes.

Guest users may view landing pages and public result pages where appropriate.

---

# 27. Invite System

Each Jam should have a unique invite code.

Example URL:

```text
https://vibejam.app/join/ABCD1234
```

Invite code requirements:

- random enough to avoid guessing
- unique
- stable for the Jam

A user should not be able to join the same Jam twice.

---

# 28. Timer

The Jam should store:

```text
started_at
build_duration_minutes
```

Do not persist constantly decreasing timer values.

Calculate time remaining from:

```text
started_at + duration
```

This ensures all participants see the same timer.

## The server is authoritative

The countdown in the browser is a display, never a gate. Every submission request
must independently re-check, server-side:

```text
now() <= started_at + (build_duration_minutes * interval '1 minute')
```

A client-side check alone is trivially bypassed by changing the system clock or
calling the API directly.

Send the server's current time alongside `started_at` when the page loads, and have
the client render the countdown from that offset rather than from its own clock.
Otherwise participants with skewed clocks see different remaining times — which
directly contradicts §32 Phase 6's acceptance criterion ("all participants see a
synchronized competition timer").

When time expires:

- prevent new normal submissions (enforced server-side, as above)
- transition appropriately
- allow the creator to proceed to judging

If late submission behavior is implemented, clearly mark it as late.

For MVP, simplest behavior is to block submissions after expiration.

---

# 29. Environment Variables

Create `.env.example`.

Example:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Server only — never exposed to the browser. Judging pipeline only (§25).
SUPABASE_SERVICE_ROLE_KEY=

# Server only — PAT with public repo read scope, for repository analysis (§16).
GITHUB_TOKEN=

# Server only
OPENAI_API_KEY=

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Do not commit `.env.local`.

## Note on GitHub OAuth credentials

`GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are **not** application environment
variables in this architecture. When GitHub OAuth is used through Supabase Auth
(§26), those values are configured in the Supabase dashboard under
Authentication → Providers, and Supabase performs the OAuth exchange. Putting them
in `.env.example` implies the app reads them, which it does not, and invites someone
to duplicate credentials into two places.

The app-side GitHub concern is `GITHUB_TOKEN`, which is a separate credential used
for reading submitted repositories.

---

# 30. README Requirements

Maintain `README.md` throughout development.

It should contain:

- what VibeJam is
- screenshots eventually
- architecture overview
- tech stack
- prerequisites
- local installation
- environment variables
- Supabase setup
- GitHub OAuth setup
- OpenAI setup
- database migration instructions
- development commands
- tests
- deployment instructions
- security notes
- current limitations
- roadmap

---

# 31. Implementation Plan

Create:

```text
docs/IMPLEMENTATION_PLAN.md
```

Keep it updated.

Use checkboxes.

Example:

```markdown
## Phase 1

- [x] Initialize project
- [x] Configure Tailwind
- [ ] Configure Supabase
- [ ] Implement authentication
```

Do not rely only on chat context.

Important project decisions should be documented in the repository.

## Two plan artifacts

- `docs/IMPLEMENTATION_PLAN.md` — the master checklist across all phases, always current.
- `docs/plans/YYYY-MM-DD-phase-N-<name>.md` — the detailed plan for one phase,
  written with the `writing-plans` skill immediately before that phase starts.

See §4.1 conflict resolution 3.

---

# 32. Development Phases

## Phase 0 — Environment Bootstrap

Must complete before Phase 1. These are environment facts, not code.

- [ ] **Agree to the Xcode license.** `git` on this machine currently exits 69 with
      "You have not agreed to the Xcode license agreements". Until this is fixed
      there is no version control at all, which blocks §44 entirely. The fix needs
      the developer's password and must be run by the developer, in a terminal:
      `sudo xcodebuild -license accept`
- [ ] **Initialize the repository.** §44 assumes a repo already exists. It does not —
      `/Users/chinmaynaringrekar/Projects/VibeJam` is a plain directory containing
      only this document. Run `git init`, set `user.name` / `user.email`, and make an
      initial commit containing this file before writing any application code.
- [ ] Confirm the Node version and record it in `.nvmrc`.
- [ ] Create the GitHub remote (optional for Phase 1, required before deploy).

Acceptance criteria:

> `git status` exits 0 and the repository has at least one commit.

Do not start Phase 1 until this passes. Building an entire foundation with no
ability to commit means no checkpoint to return to when something goes wrong.

---

## Phase 1 — Foundation

Implement:

- Next.js
- TypeScript
- Tailwind
- shadcn/ui
- ESLint
- Prettier
- basic folder structure
- environment configuration
- Supabase client/server configuration
- database migrations
- base layout
- initial landing page
- authentication architecture

Also add the scripts §43 assumes exist — `create-next-app` does not generate them:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "typecheck": "tsc --noEmit",
  "test": "vitest run --passWithNoTests",
  "test:e2e": "playwright test"
}
```

`--passWithNoTests` matters in Phase 1 specifically: Vitest exits non-zero when it
finds no test files, so without it the acceptance criterion below cannot pass on a
freshly scaffolded project. Remove the flag once real tests exist.

Acceptance criteria:

> User can run the application locally and reach a working landing page, and all four of `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` exit 0 — with the output shown, per §43.

---

## Phase 2 — Authentication

Implement:

- GitHub OAuth
- login/logout
- profile creation/update
- protected dashboard route

Acceptance criteria:

> User can sign in with GitHub and reach their dashboard.

---

## Phase 3 — Jam Creation

Implement:

- create Jam
- invite code generation
- Jam creator permissions
- Jam list on dashboard
- Jam Room shell

Acceptance criteria:

> Authenticated user can create a Jam and open its Jam Room.

---

## Phase 4 — Challenge Generator

> **Reordered.** This was Phase 5. The original order built joining before challenge
> generation, but §6 says a Jam only reaches `waiting` (the joinable state) once the
> challenge is locked — so the old Phase 4 acceptance criterion ("three users can
> join") was unreachable with the code that existed at that point. Generating and
> locking a challenge is what produces a joinable Jam, so it comes first.

Implement:

- challenge configuration form
- OpenAI challenge generation via structured output (§4)
- regenerate (in-place update, §9)
- structured validation
- challenge persistence
- challenge lock (`draft -> waiting`)

Acceptance criteria:

> Jam creator can generate, regenerate, save, and lock a challenge, and the Jam reaches `waiting`.

---

## Phase 5 — Participant Joining

> **Reordered.** This was Phase 4.

Implement:

- invite URL
- join page
- join Jam
- participant list
- duplicate join prevention (DB constraint, §9)

Acceptance criteria:

> Three different users can join the same Jam that is in `waiting`, and a fourth join attempt by an already-joined user is rejected.

---

## Phase 6 — Competition Mode

Implement:

- start Jam
- started_at
- countdown timer
- status transitions
- participant status
- challenge display

Acceptance criteria:

> All participants see the same locked challenge and synchronized competition timer.

---

## Phase 7 — Submission System

Implement:

- GitHub repository URL validation
- GitHub repo access verification
- owner/repo parsing
- exact commit SHA retrieval
- demo URL
- submission storage
- submission locking
- status update

Acceptance criteria:

> Every participant can submit one repository and the exact commit SHA is stored.

---

## Phase 8 — Repository Analyzer

Implement:

- GitHub API integration
- repository metadata
- file tree retrieval
- relevant-file filtering
- source retrieval
- size limits
- token limits
- repository summary
- error handling

Acceptance criteria:

> The backend can create a structured repository analysis for a valid submission.

---

## Phase 9 — AI Judge

Implement:

- requirement verification
- rubric scoring
- evidence extraction
- Zod schemas
- retry on invalid responses
- score validation
- total score calculation

Acceptance criteria:

> A repository can receive a complete valid score and detailed feedback.

---

## Phase 10 — Multi-Project Judging

Implement:

- judge all submissions
- track judging status
- failure recovery
- prevent duplicate judging
- cross-project comparison
- awards

Acceptance criteria:

> A completed Jam with three submissions produces three scored results.

---

## Phase 11 — Results

Implement:

- leaderboard
- category score table
- individual feedback
- awards
- repository links
- demo links
- comparison links

Acceptance criteria:

> Users can clearly understand why each project received its score.

---

## Phase 12 — Head-to-Head Comparison

Implement:

- select two participants
- score comparison
- strength comparison
- AI-generated learning feedback

Acceptance criteria:

> Users can compare two submissions and understand meaningful differences.

---

## Phase 13 — Testing and Hardening

Test:

- auth
- Jam permissions
- Jam state transitions
- invite codes
- participant joins
- challenge lock
- timer calculations
- repository URL parsing
- submission locking
- score arithmetic
- AI schema validation
- repository filtering
- authorization
- leaderboard ordering

Create at least one Playwright flow:

```text
Login
→ Create Jam
→ Join Jam
→ Generate Challenge
→ Start Jam
→ Submit Repo
→ Judge
→ View Results
```

---

# 33. Test Strategy

## Unit Tests

Use Vitest for:

- scoring
- helpers
- invite generation
- repository parsing
- timer logic
- schema validation
- status transitions

## Component Tests

Use React Testing Library for important UI components.

## E2E

Use `@playwright/test` (TypeScript) in `tests/e2e/` for critical flows.

Mock external AI/GitHub calls where necessary.

Do not make automated tests depend unnecessarily on paid API calls.

### Seams the tests need

Design these in when the code is written, not retrofitted when the E2E suite fails.

**Authentication.** The Phase 13 flow needs three distinct logged-in users. Real
GitHub OAuth cannot be automated — it is a third-party consent screen with bot
protection, and attempting to script it is both fragile and against GitHub's terms.
Instead, seed three test users directly via the Supabase admin API and inject their
sessions into the browser context before the test runs. Gate this behind a
test-only environment flag that is absent in production.

**AI and GitHub clients.** Put both behind a small interface in `lib/ai/` and
`lib/github/` so tests inject fakes. This is the one abstraction worth having
despite §42.3 — without it, every E2E run costs real money and depends on GitHub
being up, and the suite will be disabled within a week.

Fixtures should include a realistic repository tree and a realistic judged result so
the leaderboard and comparison screens can be tested deterministically.

---

# 34. Error Handling

The application must handle:

- invalid repository URL
- inaccessible/private repository
- GitHub rate limit
- repository too large
- AI timeout
- AI invalid JSON
- AI schema failure
- Supabase failure
- invalid Jam invite
- expired competition
- duplicate submission
- unauthorized access

Show useful user-facing errors.

Do not leak internal secrets or raw stack traces.

---

# 35. Observability

Use normal application logs initially.

Log useful server-side events such as:

- Jam created
- challenge generated
- challenge locked
- Jam started
- submission received
- repository analysis started
- repository analysis completed
- judging started
- judging completed
- judging failed

Do not log:

- OAuth secrets
- API keys
- access tokens

---

# 36. API Design

Prefer typed internal server APIs.

Validate all incoming data with Zod.

Do not trust:

- client input
- GitHub URLs
- AI output
- query parameters
- route parameters

All mutation endpoints must verify authentication and authorization.

---

# 37. Performance

Do not prematurely optimize.

However:

- avoid unnecessary GitHub API calls
- cache repository metadata during judging
- avoid fetching the same file multiple times
- avoid sending oversized prompts
- limit concurrent AI calls if needed
- store completed analysis so results can be revisited without re-judging

---

# 38. AI Prompt Rules

Separate prompts for:

- challenge generation
- repository summarization
- requirement evaluation
- rubric scoring
- cross-project comparison

Do not reuse one massive prompt for everything.

AI prompts should instruct the model:

- be evidence-based
- avoid guessing
- mark uncertain functionality as PARTIAL or FAIL
- cite files
- use only supplied repository data
- not assume the demo works unless verified
- follow the requested JSON schema exactly

---

# 39. Judging Fairness

Every participant must be evaluated using:

- the same challenge
- the same rubric
- the same scoring maximums
- the same prompt structure
- the same judging model configuration where possible

Use low temperature / deterministic settings where appropriate.

Scores do not need to be mathematically identical on repeated runs, but unnecessary randomness should be minimized.

---

# 40. Important MVP Limitation

The MVP judges repository evidence.

It does not truly execute the application.

Therefore:

Functionality assessments should clearly distinguish between:

- implementation evidence
- verified runtime behavior

Do not claim runtime behavior was verified if the application was not actually run.

If a live demo URL is provided, it may be stored and displayed, but browser-agent testing is outside MVP scope unless later requested.

---

# 41. Future Roadmap

Do not implement these now.

## V0.2

- live demo inspection
- automated screenshots
- browser testing
- accessibility evaluation
- performance tests

## V0.3

- public challenges
- weekly VibeJam
- user profiles
- match history
- achievements
- streaks
- public leaderboard

## V0.4

- teams
- tournaments
- community voting
- custom rubrics
- organizations

## V1.0

Potential features:

- secure sandbox execution
- automated test generation
- agent-based evaluation
- visual comparison
- GitHub App integration
- challenge marketplace

---

# 42. Development Rules for Claude

Follow these rules throughout development.

1. Build vertically, not horizontally.

2. Complete one usable workflow before adding optional features.

3. Do not over-engineer.

4. Prefer straightforward TypeScript over unnecessary abstractions.

5. Keep components reasonably small.

6. Keep business logic out of UI components where practical.

7. Validate every external API response.

8. Validate every AI response.

9. Calculate scores in application code.

10. Never execute participant repositories.

11. Never commit secrets.

12. Add tests as functionality is added.

13. Keep README updated.

14. Keep `docs/IMPLEMENTATION_PLAN.md` updated.

15. Use database migrations.

16. Keep challenge generation, repository analysis, and judging as separate modules.

17. Do not add features outside MVP without instruction.

18. If there are multiple valid technical approaches, choose the simplest maintainable one.

19. Do not redesign completed working architecture without a clear reason.

20. Run lint, typecheck, and tests after meaningful changes.

---

# 43. Required Commands / Quality Checks

Before marking a phase complete, run the relevant project commands.

Expected categories:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Add scripts if missing — see Phase 1, which lists the full set.

Do not leave known TypeScript or build errors.

## Evidence required

Per the `verification-before-completion` skill (§4.1): a command counts as passing
only if it was run in the current session and its output was read. **Paste the
actual output — or at minimum the final summary line and exit code — into the phase
report.** "Tests pass" without output is not a claim, it is a guess.

If a command fails and the failure is being deferred, say so explicitly in the
report with the failing output. Do not describe a phase as complete while a listed
command is red.

---

# 44. Git Workflow

> **Corrected.** The original text assumed the repository already existed. As of this
> audit it does not, and `git` is additionally blocked by the unaccepted Xcode
> license. Both are handled in **Phase 0**, which must complete first.

Once Phase 0 is done, work inside that repository.

Do not create a different repository unless requested.

Commit at the end of each phase at minimum, and after each completed task within a
phase where that produces a coherent checkpoint.

Use meaningful commits.

Suggested examples:

```text
chore: initialize vibejam app
feat: add github authentication
feat: add jam creation flow
feat: add challenge generation
feat: add repository submission
feat: add github repository analyzer
feat: add ai judging pipeline
feat: add leaderboard
test: add jam workflow coverage
```

Do not create huge commits covering unrelated phases.

---

# 45. Definition of Done for MVP

The MVP is complete when this flow works:

1. User A logs in with GitHub.
2. User A creates a Jam.
3. User A generates a challenge.
4. User A locks the challenge.
5. User A shares the invite.
6. Users B and C join.
7. User A starts the Jam.
8. All users see the same challenge.
9. All users see the same timer.
10. Each user independently builds a project.
11. Each user submits a GitHub repository.
12. VibeJam stores the exact commit SHA.
13. VibeJam analyzes all repositories.
14. VibeJam verifies requirements.
15. VibeJam scores each project.
16. VibeJam calculates totals.
17. VibeJam creates a leaderboard.
18. VibeJam generates awards.
19. VibeJam provides individual feedback.
20. VibeJam provides head-to-head comparisons.
21. Results can be revisited later.
22. The application can be deployed to Vercel.

---

# 46. Initial Instructions

Start by inspecting the repository.

The repository may be empty or nearly empty. It currently contains only this
document.

**First complete Phase 0** (§32) — accept the Xcode license, `git init`, initial
commit. Then:

1. Initialize the Next.js project.
2. Configure TypeScript.
3. Configure Tailwind.
4. Configure ESLint and Prettier.
5. Add shadcn/ui.
6. Create the initial directory structure.
7. Create `.env.example`.
8. Create `README.md`.
9. Create `docs/IMPLEMENTATION_PLAN.md`.
10. Create Supabase migration structure.
11. Create shared types.
12. Create validation structure.
13. Create base layout.
14. Create initial landing page.
15. Set up authentication architecture without requiring real production credentials yet.

Do not immediately implement the entire platform.

Complete Phase 1 cleanly first.

---

# 47. Phase Completion Report

At the end of every major phase, report:

## Completed

List functionality completed.

## Files Added / Changed

Summarize important files.

## Architecture Decisions

Explain any meaningful decisions.

## Verification Evidence

Paste the output of `npm run lint`, `npm run typecheck`, `npm test`, and
`npm run build`. Required by §43 — a phase report without this is incomplete.

## External Setup Required

Explain actions the developer must perform, such as:

- creating Supabase project
- GitHub OAuth app (configured in the Supabase dashboard, §29)
- creating the `GITHUB_TOKEN` PAT
- adding environment variables
- configuring callback URLs

Be specific: exact dashboard path, exact value needed, exact place it goes.

## Open Questions

Anything that was assumed rather than known. Per `karpathy-guidelines`, surface
assumptions rather than burying them.
- creating OpenAI key
- deploying to Vercel

## Verification

State results for:

- lint
- typecheck
- tests
- build

## Remaining Work

List next items.

## Blockers

Only list real blockers.

Do not invent blockers when a reasonable implementation decision can be made independently.

---

# 48. Product Philosophy

VibeJam is not initially intended to be a massive coding platform.

The first goal is:

> Make a three-person vibe-coding competition genuinely fun and easy to run.

Prioritize:

- simplicity
- fairness
- clarity
- useful feedback
- fast competition setup
- clean user experience

Avoid:

- unnecessary complexity
- excessive configuration
- enterprise-style workflows
- too many settings
- premature monetization
- premature social features

The product should feel playful, technical, and polished.

---

# 49. Long-Term Product Direction

If the MVP succeeds, VibeJam may eventually become a platform where developers can:

- join weekly coding challenges
- compete with friends
- build public profiles
- track wins and category strengths
- learn from other implementations
- participate in tournaments
- use custom challenge generators
- receive automated runtime evaluation
- compare coding agents and AI workflows

The architecture should not actively prevent these possibilities, but do not build for them prematurely.

---

# 50. Final Instruction

Use this document as the authoritative MVP specification.

If implementation details are ambiguous:

1. choose the simplest safe approach
2. preserve the intended product flow
3. keep future extensibility reasonable
4. document meaningful decisions
5. avoid adding unrelated features

Start with **Phase 1 — Foundation**.

Do not proceed by attempting to build every phase at once.

Build incrementally and keep the project runnable throughout development.
