# VibeJam

**Build. Compete. Ship.**

VibeJam runs a small vibe-coding competition end to end. One generated challenge,
one shared clock, independent builds — then structured AI judging of each
submitted GitHub repository against a fixed rubric, with every score citing the
files that earned it.

It exists because the informal version of this always collapses at the judging
step: there is no neutral party, so the argument is unresolvable and nobody
learns anything.

```text
Create Jam → Generate Challenge → Invite Friends → Lock Challenge
    → Participants Build Independently → Submit GitHub Repositories
    → Analyze Repositories → AI Judges Each Project
    → Leaderboard → Detailed Comparison
```

## Status

**Phase 1 of 13 (Foundation) is complete.** The application builds, runs, and
serves a landing page. There is no authentication, no Jams, and no judging yet —
see [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) for what is
built and what is next, and [Current limitations](#current-limitations) below.

## Screenshots

To be added once the Jam Room exists (Phase 6). The landing page is the only
screen implemented today.

## Architecture

A single Next.js application. No microservices.

- **App Router**, server components by default. Client components only where
  interaction demands it.
- **Supabase PostgreSQL** for data, with Row Level Security as the enforcement
  boundary — not the UI. A participant must not be able to read another's
  submission during an active Jam even by calling the API directly.
- **Supabase Auth** with GitHub OAuth.
- **All AI and authenticated GitHub calls happen server-side.** No key reaches
  the browser.
- **Submitted repositories are never executed.** Judging reads code; it does not
  run it.

Three Supabase entry points, in `lib/supabase/`:

| File | Key | RLS |
| --- | --- | --- |
| `client.ts` | anon | enforced |
| `server.ts` → `createServerSupabaseClient` | anon + request cookies | enforced |
| `server.ts` → `createServiceRoleClient` | service role | **bypassed** |

The service-role client exists only for the judging pipeline, which legitimately
reads every submission in a Jam and writes scores on behalf of no user. It must
never be called from a route serving a user request.

## Tech stack

| Area | Choice | Version |
| --- | --- | --- |
| Framework | Next.js | 16.3.5 |
| UI | React | 19.2.8 |
| Language | TypeScript (strict) | 5.9.3 |
| Styling | Tailwind CSS (v4, CSS-first) | 4.3.3 |
| Components | shadcn/ui (`radix-nova`) | CLI 4.x |
| Database | Supabase PostgreSQL | `@supabase/supabase-js` 2.x |
| Auth | Supabase Auth + GitHub OAuth | `@supabase/ssr` 0.12.x |
| AI | OpenAI API | — |
| Validation | Zod | 4.6.5 |
| Unit / component tests | Vitest + React Testing Library | 5.0.1 / 16.x |
| E2E | Playwright | 1.63.x |
| Quality | ESLint 9 (flat config), Prettier 3 | — |
| Hosting | Vercel | — |

There is no `tailwind.config.ts`. Tailwind v4 is CSS-first; design tokens live in
`app/globals.css`.

## Prerequisites

- **Node.js** — the version in [`.nvmrc`](.nvmrc) (26.3.1). Next.js 16 requires
  ≥ 20.9.
- **npm** — this project uses npm; `packageManager` is pinned in `package.json`.
- A **Supabase project** (Phase 2 onward).
- A **GitHub personal access token** with public repo read scope (Phase 8 onward).
- An **OpenAI API key** (Phase 5 onward).
- **Docker**, only if you want to run the Supabase stack locally.

Phase 1 runs with none of the three credentials — placeholders are enough.

## Local installation

```bash
git clone https://github.com/naringrekarchinmay/vibejam.git
```

```bash
cd vibejam
```

```bash
nvm use
```

```bash
npm install
```

```bash
cp .env.example .env.local
```

```bash
npm run dev
```

The app serves at http://localhost:3000.

For Phase 1, `.env.local` needs only syntactically valid placeholders. The public
variables are validated eagerly at import, so they must be present and the URLs
must parse.

## Environment variables

| Variable | Scope | Required from | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | public | Phase 1 | Must be a valid URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Phase 1 | Safe in the browser; RLS is the boundary |
| `NEXT_PUBLIC_APP_URL` | public | Phase 1 | Deployed origin in production |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | Phase 9 | Bypasses RLS. Judging pipeline only |
| `GITHUB_TOKEN` | **server only** | Phase 8 | PAT, public repo read scope |
| `OPENAI_API_KEY` | **server only** | Phase 4 | Never sent to the browser |

Server variables are validated lazily, inside `getServerEnv()`, so a missing
secret fails at the point of use rather than breaking the build. Validation
errors name the offending variable but never echo its value — env errors reach
logs.

`GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are deliberately **absent**. With
Supabase Auth, GitHub OAuth credentials are configured in the Supabase dashboard
and this application never reads them.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Copy the project URL and the `anon` key into `.env.local`.
3. Copy the `service_role` key into `.env.local` (server-only; never commit it).
4. Apply migrations — see [`supabase/README.md`](supabase/README.md).

> The Phase 1 migration has **not** been applied to any database. See
> "Verification status" in `supabase/README.md`.

## GitHub OAuth setup

Needed from **Phase 2**.

1. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App.
2. Authorization callback URL: `https://<project-ref>.supabase.co/auth/v1/callback`.
3. In Supabase: Authentication → Providers → GitHub. Paste the client ID and
   secret there — not into `.env.local`.
4. Add your local and deployed origins under Authentication → URL Configuration.

## GitHub token setup

Needed from **Phase 8**, for reading submitted repositories.

Create a personal access token with read access to public repositories and set it
as `GITHUB_TOKEN`. Unauthenticated GitHub API access is capped near 60 requests
per hour, which a single Jam exceeds immediately.

Submitted repositories must be **public**. Supabase does not persist the OAuth
token needed to read a private repo, so by judging time it is gone.

## OpenAI setup

Needed from **Phase 4** (Challenge Generator). Set `OPENAI_API_KEY`. All calls are server-side.

## Database migrations

See [`supabase/README.md`](supabase/README.md). Each phase adds its own migration
rather than one migration defining the whole schema up front. Never edit an
applied migration.

## Development commands

| Command | Does |
| --- | --- |
| `npm run dev` | Dev server on :3000 |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `next typegen` then `tsc --noEmit` |
| `npm test` | Vitest (unit + component) |
| `npm run test:e2e` | Playwright |
| `npm run format` | Prettier, write |
| `npm run format:check` | Prettier, check only |

`typecheck` runs `next typegen` first because the root layout uses `LayoutProps`,
a type Next generates into `.next/types`. Bare `tsc --noEmit` fails on a clean
checkout.

## Tests

```bash
npm test
```

```bash
npm run test:e2e
```

Unit and component tests live in `tests/unit/`, end-to-end specs in `tests/e2e/`.
The two directories are kept disjoint so Vitest does not try to execute Playwright
specs.

Tests must not depend on paid API calls. AI and GitHub clients get a seam so
fakes can be injected — see §33 of the build instructions.

## Deployment

1. Import the repository into Vercel.
2. Set every variable from [Environment variables](#environment-variables) in
   project settings. `NEXT_PUBLIC_APP_URL` must be the deployed origin.
3. Add the deployed origin to Supabase → Authentication → URL Configuration.
4. Deploy.

## Security notes

- Server-only variables never reach the browser, and AI and authenticated GitHub
  requests happen server-side.
- **Row Level Security is the access boundary.** Hiding a repository URL in the
  UI is not an implementation of the rule that participants cannot see each
  other's submissions during an active Jam.
- The service-role key bypasses RLS and belongs solely to the judging pipeline.
- **Submitted repositories are never executed.** No `npm install`, no `npm run
  dev`, no `pip install`. Running arbitrary participant code is out of scope.
- Secrets are never committed. `.env.local` is ignored; `.env.example` holds
  empty values only.

## Current limitations

Phase 1 only:

- No authentication. Both landing-page CTAs link to `/login`, which does not
  exist yet and returns 404.
- No Jams, challenges, submissions, judging, leaderboard, or comparison.
- The `0001` migration has never been applied to a database.
- `types/database.ts` is hand-written and covers only `users`.
- Award badges are hidden below the `sm` breakpoint, so the amber highlight does
  not appear on phones.
- Reduced-motion behavior is structurally correct but has not been verified at
  runtime.
- No CI pipeline.

## Roadmap

Deliberately not built yet.

- **V0.2** — live demo inspection, automated screenshots, browser testing,
  accessibility and performance evaluation.
- **V0.3** — public challenges, weekly VibeJam, user profiles, match history,
  achievements, public leaderboard.
- **V0.4** — teams, tournaments, community voting, custom rubrics, organizations.
- **V1.0** — secure sandbox execution, automated test generation, agent-based
  evaluation, visual comparison, GitHub App integration.

## Project documents

Repository: [naringrekarchinmay/vibejam](https://github.com/naringrekarchinmay/vibejam) (public)

| File | Purpose |
| --- | --- |
| `VIBEJAM_BUILD_INSTRUCTIONS.md` | Authoritative MVP specification |
| `PRODUCT.md` | Register, users, brand personality, design principles, accessibility target |
| `docs/IMPLEMENTATION_PLAN.md` | Master checklist across all phases |
| `docs/plans/` | Detailed per-phase plans |
| `supabase/README.md` | Migration workflow and verification status |
