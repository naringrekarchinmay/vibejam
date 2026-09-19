# Phase 1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a running, dark-themed VibeJam landing page on a fully configured Next.js + TypeScript + Tailwind + shadcn/ui foundation, with Supabase clients and the auth architecture wired but not yet authenticating, and all four quality gates green.

**Architecture:** A single Next.js App Router application at the repository root (no `src/`). Tailwind v4 is CSS-first — there is no `tailwind.config.ts`; design tokens live in `app/globals.css` under `@theme inline`. Supabase access is split into three entry points (browser, server, middleware) so that Phase 2 can add OAuth without restructuring. Environment variables are validated lazily through a Zod schema so that `next build` succeeds without real credentials.

**Tech Stack:** Next.js 16.3.5 · React 19.2.8 · TypeScript 5 · Tailwind CSS 4 · shadcn/ui (CLI 4.21.0) · Supabase (`@supabase/supabase-js` 2.x, `@supabase/ssr` 0.12.x) · Zod 4 · Vitest 5 · React Testing Library 16 · Playwright 1.63 · ESLint 9 (flat config) · Prettier 3

**Spec:** `VIBEJAM_BUILD_INSTRUCTIONS.md` — this plan implements §32 Phase 1 and §46 items 1–15.

---

## Global Constraints

Every task's requirements implicitly include this section.

- **Package manager is npm.** `package.json` must declare `"packageManager": "npm@<version>"`. The `shadcn` skill dispatches on this field. (§4)
- **No `src/` directory.** `app/`, `components/`, `lib/`, `types/` sit at the repository root. (§8)
- **TypeScript strict mode on.** (§4)
- **Node version is pinned in `.nvmrc` at `26.3.1`.** Next.js 16.3.5 requires `>=20.9.0`. (§4, Phase 0)
- **Dark theme by default.** Charcoal / near-black background, high contrast, subtle borders, one restrained accent, monospace for code-adjacent data. (§24)
- **Brand name is `VibeJam`. Tagline is `Build. Compete. Ship.`** Exact strings. (§24)
- **Never commit secrets.** `.env.local` is ignored; `.env.example` is committed and contains empty values only. (§25, §29)
- **Server-only environment variables must never be imported into a Client Component.** `SUPABASE_SERVICE_ROLE_KEY`, `GITHUB_TOKEN`, `OPENAI_API_KEY`. (§25)
- **TDD is mandatory for everything under `lib/`** and not required for scaffolding, config files, or migrations. (§4.1 resolution 2)
- **Commit at the end of every task.** Conventional commit prefixes, per §44.
- **Do not build anything from §3 "Do Not Build in MVP".** Phase 1 adds no product features beyond a landing page.

---

## Verified Environment Facts

These were confirmed by probing before this plan was written. Do not re-derive them; do not assume anything beyond them.

| Fact | Value |
|---|---|
| `create-next-app@latest` produces | Next.js `16.3.5`, React `19.2.8` |
| Generated `package.json` scripts | only `dev`, `build`, `start`, `lint` — **no `test`, no `typecheck`** |
| Generated lint script | `"lint": "eslint"` (not `next lint`) |
| Generated ESLint | flat config `eslint.config.mjs`, `eslint@^9`, `eslint-config-next@16.3.5` |
| Generated Tailwind | v4, CSS-first. **No `tailwind.config.ts` is created.** `postcss.config.mjs` uses `@tailwindcss/postcss` |
| `create-next-app` refuses a non-empty directory | **Yes** — `VIBEJAM_BUILD_INSTRUCTIONS.md` and `.nvmrc` both trigger "contains files that could conflict" |
| `.gitignore` during scaffold | **Overwritten**, not merged. Our Phase 0 content is destroyed |
| Generated `.gitignore` contains | `.env*` — which would **ignore `.env.example`**. Must be fixed |
| Also generated | `AGENTS.md` and `CLAUDE.md` |
| Zod 4 API | `z.url()` (not `z.string().url()`), `z.flattenError(err)` (not `err.flatten()`), and **native `z.toJSONSchema()`** |

> **Spec correction for §4:** the amended §4 suggests `zod-to-json-schema` for deriving JSON Schema from Zod. Zod 4 ships `z.toJSONSchema()` natively. Phase 9 should use the built-in and add no dependency. Update §4 when Phase 9 starts.

---

## File Structure

| Path | Responsibility |
|---|---|
| `package.json` | Deps, the seven scripts §43 requires, `packageManager` field |
| `.nvmrc` | Node version (exists from Phase 0) |
| `.gitignore` | Next's defaults **plus** `!.env.example` |
| `.prettierrc` / `.prettierignore` | Formatting, incl. Tailwind class sorting |
| `eslint.config.mjs` | Flat config, Next presets + Prettier disable layer |
| `vitest.config.ts` / `vitest.setup.ts` | Unit + component test runner, jsdom, `@/*` alias |
| `playwright.config.ts` | E2E runner pointed at `tests/e2e/` |
| `.env.example` | Committed template, empty values (§29) |
| `lib/env.ts` | Zod-validated, lazily-evaluated environment access |
| `lib/supabase/client.ts` | Browser Supabase client (anon key) |
| `lib/supabase/server.ts` | Server Supabase client (anon key + cookies) **and** the isolated service-role client |
| `lib/supabase/middleware.ts` | Session refresh helper |
| `lib/utils.ts` | `cn()` — created by the shadcn CLI |
| `middleware.ts` | Next middleware entry, delegates to `lib/supabase/middleware.ts` |
| `types/database.ts` | Hand-written DB row types until Phase 2 generates them |
| `supabase/migrations/0001_init_users.sql` | `users` table, `updated_at` trigger, auth sync trigger, RLS |
| `app/layout.tsx` | Root layout, `class="dark"`, fonts, metadata |
| `app/globals.css` | Tailwind import + VibeJam design tokens |
| `app/page.tsx` | Landing page (§19 `/`) |
| `components/ui/` | shadcn primitives |
| `components/landing/` | Landing-page-only composition |
| `tests/unit/` | Vitest specs |
| `tests/e2e/` | Playwright specs |
| `docs/IMPLEMENTATION_PLAN.md` | Master checklist (§31) |
| `README.md` | Per §30 |

**Decision — directories are created with their first real file.** §46 item 6 says
"create the initial directory structure" and §8 shows `lib/ai/`, `lib/github/`,
`lib/scoring/`, `lib/validation/`, `components/jam/`, `components/judging/` and so
on. Phase 1 does **not** create those as empty placeholders, for two reasons: git
cannot track an empty directory, so they would not survive a clone; and §8 states
outright that the structure is "guidance, not a rigid constraint". Each directory
appears in the phase that first puts a file in it. The validation structure §46
item 12 asks for is `lib/env.ts` plus the Zod dependency — the schema modules for
AI responses arrive in Phase 9, where they have something to validate.

A reviewer noting "the §8 directories are missing" should be answered with this
paragraph, not with `mkdir`.

---

## Task 1: Scaffold the Next.js application and quality tooling — ✅ DONE (commit `3e75ab9`)

> **What actually happened.** Four deviations from the steps below. They are
> recorded here rather than rewritten into the steps, because the steps are what
> was attempted and the deviations are what a future reader needs to know.
>
> 1. **Steps 1–3 did not work.** `create-next-app` derives the npm package name
>    from the target directory, and `VibeJam` contains capitals, which npm
>    rejects outright (`name can no longer contain capital letters`). Moving the
>    conflicting files aside was necessary but not sufficient. What worked:
>    scaffold into `.phase1-tmp/scaffold/vibejam` with `--skip-install`, move the
>    contents up into the repository root, then `npm install` in place. Moving
>    before installing avoids relocating `node_modules`.
> 2. **Step 5's verification was wrong.** `git check-ignore -v` exits 0 whenever
>    *any* pattern matches — including a negation — so it cannot distinguish
>    ignored from un-ignored. Use `git check-ignore -q <path>` (exit 1 = not
>    ignored) and confirm with `git add -n <path>`.
> 3. **Vitest was installed in this task, not Task 2.** Step 10 sets
>    `"test": "vitest run"`, so deferring the binary to Task 2 would have
>    committed a package.json whose script could not run. Installing it also
>    surfaced a conflict: Vitest 5 requires `@types/node` `^22 || >=24` and the
>    scaffold pins `^20`. Fixed by bumping to `^26` to match the Node runtime —
>    **not** with `--legacy-peer-deps`, which would have left a broken
>    resolution in the lockfile.
> 4. **`typecheck` needed `next typegen`.** The scaffolded `app/layout.tsx` uses
>    `LayoutProps<"/">`, a global type Next generates into `.next/types`. Bare
>    `tsc --noEmit` fails on a clean checkout while `next build` passes, because
>    build generates the types first. The script is
>    `next typegen && tsc --noEmit`.
>
> Also decided here: **`*.md` is excluded from Prettier.** Its first run repadded
> every table in the spec and the plan and rewrote `*emphasis*` as `_emphasis_`.
> Nothing was lost, but it churns the authoritative reference document and would
> bury real amendments in cosmetic noise.
>
> **Gates at commit (clean `.next`):** lint 0 · typecheck 0 · test 0 · build 0 ·
> format:check 0.
>
> Note: the shell here is **zsh**, so `$PIPESTATUS` is empty — use `$pipestatus`
> or capture `$?` directly. Several gate runs silently reported no exit code
> before this was spotted.

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `next-env.d.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `public/*`, `AGENTS.md`, `CLAUDE.md`
- Modify: `.gitignore`
- Create: `.prettierrc`, `.prettierignore`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: a working npm project with scripts `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:e2e`. Every later task relies on these script names.

- [ ] **Step 1: Move the two conflicting files aside**

`create-next-app` refuses to scaffold into a directory containing unrecognized files. This is verified behavior, not a precaution.

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam
mkdir -p .phase1-tmp
mv VIBEJAM_BUILD_INSTRUCTIONS.md .nvmrc .phase1-tmp/
ls -a
```

Expected: directory contains only `.`, `..`, `.git`, `.gitignore`, `.phase1-tmp`, `docs`.

- [ ] **Step 2: Scaffold**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam
npx --yes create-next-app@latest . \
  --ts --tailwind --eslint --app --no-src-dir \
  --import-alias "@/*" --use-npm --disable-git --yes
```

Expected: `Success! Created vibejam at ...`. `--disable-git` matters — the repository already exists from Phase 0 and must not be reinitialized.

- [ ] **Step 3: Restore the moved files**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam
mv .phase1-tmp/VIBEJAM_BUILD_INSTRUCTIONS.md .phase1-tmp/.nvmrc .
rmdir .phase1-tmp
cat .nvmrc
```

Expected: `26.3.1`.

- [ ] **Step 4: Fix `.gitignore` so `.env.example` is committable**

The generated `.gitignore` contains `.env*`, which would silently exclude the template §29 requires. Append:

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam
cat >> .gitignore <<'EOF'

# Commit the env template (see VIBEJAM_BUILD_INSTRUCTIONS.md §29)
!.env.example
EOF
```

- [ ] **Step 5: Verify the exception actually works**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam
touch .env.example
git check-ignore -v .env.example; echo "check-ignore exit=$?"
```

Expected: **exit=1** and no output — meaning the file is *not* ignored. If it prints a rule and exits 0, the negation failed; fix before continuing.

- [ ] **Step 6: Install Prettier and the remaining dev tooling**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam
npm install -D prettier eslint-config-prettier prettier-plugin-tailwindcss
```

- [ ] **Step 7: Write `.prettierrc`**

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

- [ ] **Step 8: Write `.prettierignore`**

```text
.next
node_modules
coverage
playwright-report
test-results
next-env.d.ts
package-lock.json
```

- [ ] **Step 9: Layer Prettier into `eslint.config.mjs`**

Replace the file with this. `eslintConfigPrettier` must come last so it can switch off stylistic rules that would fight Prettier.

```js
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  eslintConfigPrettier,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
```

- [ ] **Step 10: Set the project name, `packageManager`, and the full script set**

Edit `package.json`. Set `"name": "vibejam"`. Replace the `scripts` block and add `packageManager` (use the real npm version — run `npm -v` and substitute it):

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "typecheck": "tsc --noEmit",
  "test": "vitest run --passWithNoTests",
  "test:e2e": "playwright test"
},
"packageManager": "npm@11.16.0"
```

`--passWithNoTests` is required right now: Vitest exits non-zero when it finds no test files, and there are none until Task 2. Task 2 removes the flag.

- [ ] **Step 11: Format the whole tree once**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam && npm run format
```

- [ ] **Step 12: Run all four gates**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam
npm run lint && npm run typecheck && npm test && npm run build
echo "ALL GATES EXIT=$?"
```

Expected: `ALL GATES EXIT=0`. Per §43, read the output — do not infer success from the absence of a visible error.

- [ ] **Step 13: Commit**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam
git add -A
git commit -m "chore: scaffold next.js app with typescript, tailwind, eslint, prettier

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 2: Testing harness (Vitest + React Testing Library + Playwright)

**Files:**
- Create: `vitest.config.ts`, `vitest.setup.ts`, `playwright.config.ts`, `tests/unit/smoke.test.ts`, `tests/e2e/landing.spec.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: the script names from Task 1.
- Produces: `npm test` runs `tests/unit/**/*.test.{ts,tsx}` in jsdom with `@/*` resolved and `@testing-library/jest-dom` matchers loaded. `npm run test:e2e` runs `tests/e2e/**` against a dev server it starts itself. Every later task writes its tests into these two directories.

- [ ] **Step 1: Install test dependencies**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam
npm install -D @vitejs/plugin-react vite-tsconfig-paths jsdom \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event \
  @playwright/test
npx playwright install chromium
```

`vitest` and the `@types/node@^26` bump it requires were already installed in
Task 1 — do not reinstall them.

`vite-tsconfig-paths` is what makes the `@/*` alias resolve inside Vitest; without it every `@/lib/...` import in a test fails to resolve.

- [ ] **Step 2: Write `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    exclude: ["tests/e2e/**", "node_modules/**"],
  },
});
```

`exclude` matters: without it Vitest tries to execute the Playwright specs and fails on `@playwright/test` imports.

- [ ] **Step 3: Write `vitest.setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Write the failing smoke test**

`tests/unit/smoke.test.ts` — this exists to prove the harness itself works, and is the one test in the project that is allowed to assert something trivial.

```ts
import { describe, expect, it } from "vitest";

describe("test harness", () => {
  it("runs unit tests", () => {
    expect(1 + 1).toBe(2);
  });

  it("provides jest-dom matchers", () => {
    const el = document.createElement("div");
    el.textContent = "VibeJam";
    document.body.appendChild(el);
    expect(el).toBeInTheDocument();
    expect(el).toHaveTextContent("VibeJam");
  });
});
```

- [ ] **Step 5: Run it**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam && npx vitest run
```

Expected: `2 passed`. If `toBeInTheDocument` is reported as not a function, `vitest.setup.ts` is not being loaded — fix `setupFiles` before continuing.

- [ ] **Step 6: Drop `--passWithNoTests`**

Real tests now exist, so the flag would only hide a future misconfiguration that silently matches zero files. In `package.json`:

```json
"test": "vitest run"
```

- [ ] **Step 7: Write `playwright.config.ts`**

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Step 8: Write the placeholder E2E spec**

`tests/e2e/landing.spec.ts`. It asserts only what Task 1's scaffold guarantees; Task 7 rewrites it against the real landing page.

```ts
import { expect, test } from "@playwright/test";

test("landing page responds", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
});
```

- [ ] **Step 9: Verify E2E runs**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam && npm run test:e2e
```

Expected: `1 passed`.

- [ ] **Step 10: Confirm the other gates still pass, then commit**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam
npm run lint && npm run typecheck && npm test
git add -A
git commit -m "test: add vitest, react testing library, and playwright harness

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 3: Environment configuration module (TDD)

This task is under `lib/`, so the TDD Iron Law applies (§4.1 resolution 2). Write the test first and watch it fail.

**Files:**
- Create: `lib/env.ts`, `tests/unit/lib/env.test.ts`, `.env.example`, `.env.local`
- Modify: none

**Interfaces:**
- Consumes: the Vitest harness from Task 2.
- Produces:
  - `publicEnv: { NEXT_PUBLIC_SUPABASE_URL: string; NEXT_PUBLIC_SUPABASE_ANON_KEY: string; NEXT_PUBLIC_APP_URL: string }` — a plain object, safe in Client Components.
  - `getServerEnv(): { SUPABASE_SERVICE_ROLE_KEY: string; GITHUB_TOKEN: string; OPENAI_API_KEY: string }` — **a function, called at use site, never at module top level.**
  - `parseServerEnv(source: Record<string, string | undefined>)` — exported only for tests.

**Design note — why `getServerEnv` is lazy.** `next build` runs with no real credentials and must still succeed (Phase 1 acceptance). Validating server secrets at module scope would throw during the build's static analysis pass the moment any file imported the module. Validating inside a function defers the check to the first real request, which is where a missing secret actually matters. Public variables are inlined by Next at build time and are validated eagerly, which is safe because `.env.local` supplies placeholders.

- [ ] **Step 1: Write the failing test**

`tests/unit/lib/env.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseServerEnv } from "@/lib/env";

const valid = {
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  GITHUB_TOKEN: "ghp_token",
  OPENAI_API_KEY: "sk-key",
};

describe("parseServerEnv", () => {
  it("returns the parsed values when all secrets are present", () => {
    expect(parseServerEnv(valid)).toEqual(valid);
  });

  it("throws when a secret is missing", () => {
    const { GITHUB_TOKEN: _omitted, ...missing } = valid;
    expect(() => parseServerEnv(missing)).toThrow(/GITHUB_TOKEN/);
  });

  it("throws when a secret is an empty string", () => {
    expect(() => parseServerEnv({ ...valid, OPENAI_API_KEY: "" })).toThrow(/OPENAI_API_KEY/);
  });

  it("names every missing variable, not just the first", () => {
    expect(() => parseServerEnv({})).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
    expect(() => parseServerEnv({})).toThrow(/OPENAI_API_KEY/);
  });

  it("does not put secret values in the error message", () => {
    try {
      parseServerEnv({ ...valid, GITHUB_TOKEN: "" });
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(String(error)).not.toContain("service-role-key");
      expect(String(error)).not.toContain("sk-key");
    }
  });
});
```

The last case is a §25 requirement, not a nicety: a thrown env error frequently ends up in a log aggregator, and an error that echoes the values it was validating leaks every secret at once.

- [ ] **Step 2: Run it and watch it fail**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam && npx vitest run tests/unit/lib/env.test.ts
```

Expected: FAIL — `Failed to resolve import "@/lib/env"`. This is the correct failure. Do not proceed if it fails for any other reason.

- [ ] **Step 3: Install Zod**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam && npm install zod
```

- [ ] **Step 4: Write `lib/env.ts`**

```ts
import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.url(),
});

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  GITHUB_TOKEN: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
});

/**
 * Builds an error that names the offending variables without echoing their
 * values. Env errors reach logs; the values are secrets (§25).
 */
function describeFailure(error: z.ZodError, scope: string): Error {
  const names = Object.keys(z.flattenError(error).fieldErrors).sort();
  return new Error(`Invalid ${scope} environment variables: ${names.join(", ")}`);
}

/** Exported for tests. Prefer `getServerEnv()` in application code. */
export function parseServerEnv(source: Record<string, string | undefined>) {
  const result = serverSchema.safeParse(source);
  if (!result.success) throw describeFailure(result.error, "server");
  return result.data;
}

/** Exported for tests. Prefer `publicEnv` in application code. */
export function parsePublicEnv(source: Record<string, string | undefined>) {
  const result = publicSchema.safeParse(source);
  if (!result.success) throw describeFailure(result.error, "public");
  return result.data;
}

/**
 * Public values are inlined by Next at build time, so they must be referenced
 * as literal property accesses rather than looked up dynamically.
 */
export const publicEnv = parsePublicEnv({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

/**
 * Server-only secrets. Called at use site, never at module scope, so that
 * `next build` succeeds without real credentials.
 *
 * Never import this from a Client Component.
 */
export function getServerEnv() {
  return parseServerEnv({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  });
}
```

- [ ] **Step 5: Give Vitest the public env vars**

`publicEnv` is evaluated at module scope, and Vitest does **not** load `.env.local`
into `process.env`. Without this step, importing `@/lib/env` throws during every
test that touches it — including the one just written, and every component test in
Task 7 that transitively imports a Supabase client.

Add `env` to the `test` block in `vitest.config.ts`:

```ts
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    exclude: ["tests/e2e/**", "node_modules/**"],
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    },
  },
```

Server secrets are deliberately **not** listed here: `getServerEnv()` is lazy, and
the env test supplies its own values directly to `parseServerEnv`.

- [ ] **Step 6: Run the test and watch it pass**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam && npx vitest run tests/unit/lib/env.test.ts
```

Expected: `5 passed`. If it fails with `Invalid public environment variables`, Step 5
did not take effect.

- [ ] **Step 7: Write `.env.example`** (committed; empty values only, per §29)

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

Note: `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` are deliberately absent. With Supabase Auth they are configured in the Supabase dashboard, not read by this app (§29).

- [ ] **Step 8: Write `.env.local` with placeholders** (ignored by git; never committed)

Phase 1 has no real Supabase project yet, and `publicEnv` validates eagerly, so `next build` needs syntactically valid placeholders.

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key
SUPABASE_SERVICE_ROLE_KEY=placeholder-service-role-key
GITHUB_TOKEN=placeholder-github-token
OPENAI_API_KEY=placeholder-openai-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 9: Confirm `.env.local` is ignored and `.env.example` is not**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam
git check-ignore -v .env.local && echo "OK: .env.local ignored"
git check-ignore -v .env.example; test $? -eq 1 && echo "OK: .env.example tracked"
```

Expected: both `OK:` lines print. This is the check that prevents a secret reaching the remote.

- [ ] **Step 10: Run all gates and commit**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam
npm run lint && npm run typecheck && npm test && npm run build
git add -A
git commit -m "feat: add zod-validated environment configuration

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 4: shadcn/ui and the VibeJam dark theme

**Files:**
- Create: `components.json`, `lib/utils.ts`, `components/ui/button.tsx`, `components/ui/card.tsx`
- Modify: `app/globals.css`, `app/layout.tsx`

**Interfaces:**
- Consumes: Task 1's Tailwind v4 setup.
- Produces: `cn(...inputs: ClassValue[]): string` from `@/lib/utils`; `Button` and `Card` from `@/components/ui/*`; and the CSS custom properties below, which Task 7 styles against.

**Use the `shadcn` skill for this task** (§4.1).

- [ ] **Step 1: Initialize shadcn/ui**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam
npx shadcn@latest init
```

Choose the **Neutral** base color when prompted. This writes `components.json`, creates `lib/utils.ts`, installs `clsx`/`tailwind-merge`/`class-variance-authority`, and rewrites `app/globals.css` with its own token layer. The rewrite is expected — Step 3 overlays VibeJam's palette on top of it.

- [ ] **Step 2: Add the two primitives the landing page needs**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam
npx shadcn@latest add button card
```

YAGNI applies — add only these two. Later phases add their own as they need them.

- [ ] **Step 3: Overlay the VibeJam palette in `app/globals.css`**

Append this block **after** whatever shadcn wrote, so it wins. §24 calls for charcoal/near-black, high contrast, subtle borders, one restrained accent, and a monospace face for code-adjacent data.

```css
/* ---- VibeJam design tokens (spec §24) ---- */
/* Dark is the default and the only theme shipped in MVP. */
:root,
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.185 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.185 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.82 0.21 130);
  --primary-foreground: oklch(0.145 0 0);
  --secondary: oklch(0.24 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.24 0 0);
  --muted-foreground: oklch(0.68 0 0);
  --accent: oklch(0.78 0.16 70);
  --accent-foreground: oklch(0.145 0 0);
  --destructive: oklch(0.58 0.21 27);
  --destructive-foreground: oklch(0.985 0 0);
  --border: oklch(0.26 0 0);
  --input: oklch(0.26 0 0);
  --ring: oklch(0.82 0.21 130);
  --radius: 0.5rem;
}

@theme inline {
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans), ui-sans-serif, system-ui, sans-serif;
}
```

**Two accents, chosen by the project owner on 2026-09-19** (§24 as amended):
`--primary` is lime and carries CTAs, the countdown and the leaderboard;
`--accent` is amber and carries awards and badges.

Both are light, so their foreground is **dark** (`oklch(0.145 0 0)`), not white —
white text on lime is unreadable. Verify this in Step 5 rather than trusting it.
`--destructive` stays red and is reserved for genuine failure states (§34).

- [ ] **Step 4: Force dark mode in `app/layout.tsx`**

Set `className="dark"` on `<html>`. The scaffold's `prefers-color-scheme` behavior must go — §24 specifies dark **by default**, not dark-if-the-OS-says-so. Light mode is not in MVP scope.

```tsx
<html lang="en" className="dark">
```

- [ ] **Step 5: Verify the tokens compile**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam && npm run build
```

Expected: exit 0. A malformed `oklch()` or an unclosed block surfaces here as a PostCSS error.

- [ ] **Step 6: Run all gates and commit**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam
npm run lint && npm run typecheck && npm test && npm run build
git add -A
git commit -m "feat: add shadcn/ui and vibejam dark theme tokens

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 5: Supabase clients and authentication architecture

No real credentials are required, and no OAuth flow is implemented — that is Phase 2. This task only establishes the three access points so Phase 2 adds a provider rather than a structure.

**Files:**
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`, `middleware.ts`, `types/database.ts`, `tests/unit/lib/supabase/service-role.test.ts`
- Modify: none

**Interfaces:**
- Consumes: `publicEnv` and `getServerEnv` from `@/lib/env` (Task 3).
- Produces:
  - `createBrowserSupabaseClient(): SupabaseClient<Database>` from `@/lib/supabase/client`
  - `createServerSupabaseClient(): Promise<SupabaseClient<Database>>` from `@/lib/supabase/server`
  - `createServiceRoleClient(): SupabaseClient<Database>` from `@/lib/supabase/server`
  - `updateSession(request: NextRequest): Promise<NextResponse>` from `@/lib/supabase/middleware`
  - `Database`, `UserRow` from `@/types/database`

**Design note — key separation (§25).** `createServerSupabaseClient` uses the anon key plus the caller's cookies, so every query it makes passes through RLS. `createServiceRoleClient` bypasses RLS entirely and exists solely for the judging pipeline in Phase 9+. They live in one file but are named so that misuse is visible in a diff, and the service-role function carries a warning comment. Phase 9 is where it is first legitimately called.

- [ ] **Step 1: Install the Supabase packages**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: Write `types/database.ts`**

Hand-written for now. Phase 2 replaces this with `supabase gen types typescript` output once a real project exists.

```ts
export type UserRow = {
  id: string;
  github_id: string;
  github_username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      users: {
        Row: UserRow;
        Insert: Omit<UserRow, "created_at" | "updated_at"> &
          Partial<Pick<UserRow, "created_at" | "updated_at">>;
        Update: Partial<UserRow>;
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
  };
};
```

- [ ] **Step 3: Write `lib/supabase/client.ts`**

```ts
import { createBrowserClient } from "@supabase/ssr";

import { publicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/** Browser-side client. Anon key only — every query passes through RLS. */
export function createBrowserSupabaseClient() {
  return createBrowserClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
```

- [ ] **Step 4: Write `lib/supabase/server.ts`**

```ts
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { getServerEnv, publicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Server-side client scoped to the caller's session.
 * Anon key + cookies, so RLS applies. Use this for anything user-facing.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // Middleware refreshes the session, so this is safe to ignore.
          }
        },
      },
    },
  );
}

/**
 * DANGER: bypasses Row Level Security completely.
 *
 * Only the judging pipeline (§12) may use this — it legitimately reads every
 * submission in a Jam and writes scores on behalf of no user. Never call this
 * from a route that serves a user request. See §25.
 */
export function createServiceRoleClient() {
  const { SUPABASE_SERVICE_ROLE_KEY } = getServerEnv();

  return createClient<Database>(publicEnv.NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
```

- [ ] **Step 5: Write `lib/supabase/middleware.ts`**

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { publicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Refreshes the Supabase session cookie on every request.
 *
 * Route protection is deliberately NOT here yet — Phase 2 adds it once real
 * authentication exists.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  await supabase.auth.getUser();

  return response;
}
```

- [ ] **Step 6: Write `middleware.ts` at the repository root**

```ts
import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

- [ ] **Step 7: Write the guard test**

`tests/unit/lib/supabase/service-role.test.ts`. This is a §25 regression guard: it fails loudly if someone later makes the service-role client eager, which would both break `next build` and make accidental import dangerous.

```ts
import { describe, expect, it, vi } from "vitest";

describe("service role client", () => {
  it("does not read secrets at module import time", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    // Importing must not throw — the secret is read lazily, inside the call.
    const mod = await import("@/lib/supabase/server");
    expect(typeof mod.createServiceRoleClient).toBe("function");
    vi.unstubAllEnvs();
  });
});
```

- [ ] **Step 8: Run it**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam && npx vitest run tests/unit/lib/supabase/service-role.test.ts
```

Expected: `1 passed`.

- [ ] **Step 9: Run all gates and commit**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam
npm run lint && npm run typecheck && npm test && npm run build
git add -A
git commit -m "feat: add supabase browser, server, and middleware clients

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 6: Database migration structure and the users table

**Files:**
- Create: `supabase/migrations/0001_init_users.sql`, `supabase/README.md`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: nothing at runtime. This task produces SQL only.
- Produces: the `public.users` table matching `UserRow` from Task 5, plus `public.set_updated_at()` and `public.handle_new_user()`, which later migrations reuse.

**Scope note.** Phase 1 creates only the `users` table, not all of §9. §42.1 says build vertically — `users` is the one table Phase 2 needs, and creating six tables for features that do not exist yet is exactly the speculative work §42.3 forbids. Each later phase adds its own migration. The `set_updated_at` helper is shared, so it is defined here.

**Not applied in Phase 1.** There is no Supabase project yet. This task writes and syntax-checks the migration; applying it is Phase 2's external setup step.

- [ ] **Step 1: Ignore Supabase CLI local state**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam
cat >> .gitignore <<'EOF'

# Supabase CLI local state
supabase/.branches
supabase/.temp
EOF
```

- [ ] **Step 2: Write `supabase/migrations/0001_init_users.sql`**

```sql
-- VibeJam 0001 — users
--
-- public.users mirrors auth.users with the GitHub profile fields the product
-- needs. users.id IS auth.users.id: every RLS policy in this project is written
-- in terms of auth.uid(), and they only work if that equality holds (§9).

-- Shared trigger function, reused by every later migration.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.users (
  id              uuid primary key references auth.users (id) on delete cascade,
  github_id       text not null unique,
  github_username text not null,
  display_name    text,
  avatar_url      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index users_github_username_idx on public.users (github_username);

create trigger users_set_updated_at
  before update on public.users
  for each row
  execute function public.set_updated_at();

-- Populates public.users on first GitHub login (§26). Runs as definer because
-- the signing-up user has no INSERT privilege of their own yet.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, github_id, github_username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'provider_id', new.id::text),
    coalesce(new.raw_user_meta_data ->> 'user_name', 'unknown'),
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update set
    github_username = excluded.github_username,
    display_name    = excluded.display_name,
    avatar_url      = excluded.avatar_url,
    updated_at      = now();

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Row Level Security (§25).
alter table public.users enable row level security;

create policy users_select_own
  on public.users for select
  using (auth.uid() = id);

create policy users_update_own
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No INSERT policy by design: rows are created only by handle_new_user().
-- No DELETE policy by design: removal cascades from auth.users.
```

- [ ] **Step 3: Write `supabase/README.md`**

```markdown
# Supabase

## Migrations

Migrations are numbered SQL files in `migrations/`, applied in filename order.
Never modify a migration that has been applied to a shared environment — add a
new one (§9).

## Applying migrations

Requires the Supabase CLI and Docker for the local stack.

```bash
npx supabase start          # local stack
npx supabase db reset       # re-apply every migration from scratch
```

Against a hosted project:

```bash
npx supabase link --project-ref <ref>
npx supabase db push
```

## Regenerating types

After a schema change, regenerate `types/database.ts`:

```bash
npx supabase gen types typescript --local > types/database.ts
```

Phase 1 hand-writes that file because no project exists yet.
```

- [ ] **Step 4: Syntax-check the SQL without a database**

A full apply needs Docker, which Phase 1 does not require. Check for the errors that are cheap to catch:

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam
grep -c "create policy" supabase/migrations/0001_init_users.sql
awk '{ n += gsub(/\(/,"("); m += gsub(/\)/,")") } END { print "parens:", n, m; exit (n==m ? 0 : 1) }' \
  supabase/migrations/0001_init_users.sql
```

Expected: `2` policies, and balanced parentheses with exit 0.

If Docker is available, prefer the real check — it is strictly better evidence:

```bash
npx supabase start && npx supabase db reset
```

Record in the phase report which of the two checks was actually run. Do not describe the migration as verified if only the grep ran.

- [ ] **Step 5: Run all gates and commit**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam
npm run lint && npm run typecheck && npm test && npm run build
git add -A
git commit -m "feat: add supabase migration structure and users table

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 7: Base layout and landing page

**Files:**
- Modify: `app/layout.tsx`, `app/page.tsx`
- Create: `components/landing/hero.tsx`, `components/landing/flow-steps.tsx`, `tests/unit/components/landing/flow-steps.test.tsx`, `tests/e2e/landing.spec.ts` (rewrite)

**Interfaces:**
- Consumes: `Button`, `Card` from `@/components/ui/*` and the theme tokens from Task 4.
- Produces: the `/` route required by §19. No later task depends on these components.

**Content requirements (§19, §24).** The page must explain VibeJam, show the basic flow, and present two CTAs: *Start a Jam* and *Sign in with GitHub*. Both link to `/login`, which does not exist until Phase 2 — that is expected and acceptable for Phase 1. The tagline is exactly `Build. Compete. Ship.`

**Apply the `ui-ux-pro-max` skill** for layout, type scale, and spacing decisions before writing the markup (§4.1). Then stop — §24 says "do not over-design the first version."

- [ ] **Step 1: Write the failing component test**

`tests/unit/components/landing/flow-steps.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FlowSteps } from "@/components/landing/flow-steps";

describe("FlowSteps", () => {
  it("renders every stage of the product loop in order", () => {
    render(<FlowSteps />);

    const items = screen.getAllByRole("listitem").map((el) => el.textContent);

    expect(items).toEqual([
      expect.stringContaining("Create a Jam"),
      expect.stringContaining("Generate a challenge"),
      expect.stringContaining("Invite friends"),
      expect.stringContaining("Build independently"),
      expect.stringContaining("Submit your repo"),
      expect.stringContaining("Get judged"),
      expect.stringContaining("Compare results"),
    ]);
  });

  it("numbers the steps for screen readers", () => {
    render(<FlowSteps />);
    expect(screen.getByRole("list")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam && npx vitest run tests/unit/components/landing/flow-steps.test.tsx
```

Expected: FAIL — `Failed to resolve import "@/components/landing/flow-steps"`.

- [ ] **Step 3: Write `components/landing/flow-steps.tsx`**

```tsx
const STEPS = [
  "Create a Jam",
  "Generate a challenge",
  "Invite friends",
  "Build independently",
  "Submit your repo",
  "Get judged",
  "Compare results",
] as const;

export function FlowSteps() {
  return (
    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {STEPS.map((step, index) => (
        <li
          key={step}
          className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
        >
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="text-sm text-foreground">{step}</span>
        </li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 4: Run the test and watch it pass**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam && npx vitest run tests/unit/components/landing/flow-steps.test.tsx
```

Expected: `2 passed`.

- [ ] **Step 5: Write `components/landing/hero.tsx`**

```tsx
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="flex flex-col items-center gap-6 text-center">
      <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
        Build. Compete. Ship.
      </p>

      <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
        Vibe-coding competitions for you and your friends
      </h1>

      <p className="max-w-xl text-base text-pretty text-muted-foreground">
        Everyone gets the same challenge and the same clock. Build your own solution, submit your
        repo, and get scored against one shared rubric — with the evidence to back it up.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/login">Start a Jam</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/login">Sign in with GitHub</Link>
        </Button>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Write `app/page.tsx`**

```tsx
import { FlowSteps } from "@/components/landing/flow-steps";
import { Hero } from "@/components/landing/hero";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col justify-center gap-16 px-4 py-20">
      <Hero />

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          How it works
        </h2>
        <FlowSteps />
      </section>
    </main>
  );
}
```

- [ ] **Step 7: Update the metadata in `app/layout.tsx`**

Keep `className="dark"` from Task 4 and the scaffold's font wiring. Replace only the metadata export:

```tsx
export const metadata: Metadata = {
  title: "VibeJam — Build. Compete. Ship.",
  description:
    "Vibe-coding competitions for you and your friends. Same challenge, same clock, one shared rubric.",
};
```

- [ ] **Step 8: Rewrite the E2E spec against the real page**

`tests/e2e/landing.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("landing page shows the brand, tagline, and both CTAs", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/VibeJam/);
  await expect(page.getByText("Build. Compete. Ship.")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start a Jam" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in with GitHub" })).toBeVisible();
});

test("landing page lists the product flow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("listitem")).toHaveCount(7);
});
```

- [ ] **Step 9: Run the E2E suite**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam && npm run test:e2e
```

Expected: `2 passed`.

- [ ] **Step 10: Look at the page**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam && npm run dev
```

Open `http://localhost:3000`. Confirm against §24: near-black background, high contrast text, subtle borders on the flow cards, the violet accent on the primary CTA only, monospace for the step numbers and the tagline. Confirm it is readable at 375px wide.

- [ ] **Step 11: Run all gates and commit**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam
npm run lint && npm run typecheck && npm test && npm run build
git add -A
git commit -m "feat: add base layout and landing page

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 8: Documentation and Phase 1 verification

**Files:**
- Modify: `README.md` (replace the scaffold's)
- Create: `docs/IMPLEMENTATION_PLAN.md`

**Interfaces:**
- Consumes: everything from Tasks 1–7.
- Produces: the §31 master checklist, which every later phase updates.

- [ ] **Step 1: Replace `README.md`**

`create-next-app` writes a generic Next.js README. Replace it entirely with a VibeJam README covering the §30 list. Sections, in order:

1. **What VibeJam is** — one paragraph, plus the §1 product loop diagram.
2. **Screenshots** — a placeholder line noting they land once the Jam Room exists.
3. **Architecture overview** — single Next.js app, App Router, Supabase Postgres + Auth, server-side AI and GitHub calls only.
4. **Tech stack** — with the real installed versions, read from `package.json`. Do not write versions from memory.
5. **Prerequisites** — Node (point at `.nvmrc`), npm, a Supabase project, a GitHub PAT, an OpenAI key.
6. **Local installation** — `nvm use`, `npm install`, `cp .env.example .env.local`, `npm run dev`.
7. **Environment variables** — the §29 table, marking each server-only or public, and the note that `GITHUB_CLIENT_ID`/`SECRET` live in the Supabase dashboard rather than here.
8. **Supabase setup** — create project, copy URL and anon key, apply migrations via `supabase/README.md`.
9. **GitHub OAuth setup** — OAuth app, callback `https://<ref>.supabase.co/auth/v1/callback`, credentials entered in Supabase → Authentication → Providers. Mark as **Phase 2**.
10. **OpenAI setup** — key in `OPENAI_API_KEY`, server-side only. Mark as **Phase 5**.
11. **Database migrations** — point at `supabase/README.md`.
12. **Development commands** — the seven scripts, one line each.
13. **Tests** — `npm test` (Vitest), `npm run test:e2e` (Playwright).
14. **Deployment** — Vercel, with every env var set in project settings; `NEXT_PUBLIC_APP_URL` must be the deployed origin.
15. **Security notes** — server-only vars never reach the browser; RLS enforces access; submitted repositories are never executed (§25); submitted repos must be public (§16).
16. **Current limitations** — Phase 1 only: no authentication, no Jams, migrations written but not applied.
17. **Roadmap** — the §41 V0.2–V1.0 summary.

- [ ] **Step 2: Create `docs/IMPLEMENTATION_PLAN.md`**

The master checklist (§31). Phase 0 and Phase 1 fully checked; Phases 2–13 listed with unchecked items drawn from §32. Header:

```markdown
# VibeJam Implementation Plan

Master checklist across all phases. Detailed per-phase plans live in `docs/plans/`.
See `VIBEJAM_BUILD_INSTRUCTIONS.md` for the authoritative spec.

## Phase 0 — Environment Bootstrap ✅

- [x] Accept Xcode license (unblocks git)
- [x] `git init` on `main`
- [x] `.nvmrc` pinned to 26.3.1
- [x] Initial commit

## Phase 1 — Foundation ✅

- [x] Next.js + TypeScript + Tailwind scaffold
- [x] ESLint + Prettier
- [x] npm scripts: lint, typecheck, test, test:e2e, build
- [x] Vitest + React Testing Library + Playwright
- [x] Zod-validated environment configuration
- [x] shadcn/ui + VibeJam dark theme
- [x] Supabase browser/server/middleware clients
- [x] Migration structure + users table
- [x] Base layout + landing page
- [x] README + this plan

## Phase 2 — Authentication

- [ ] GitHub OAuth via Supabase Auth
- [ ] Login / logout
- [ ] Profile creation and update on first login
- [ ] Protected dashboard route
- [ ] Apply migration 0001 to a real Supabase project
- [ ] Regenerate `types/database.ts` from the live schema
```

Continue with Phases 3–13, taking each item verbatim from §32.

- [ ] **Step 3: Run the full gate set and capture the output**

This is the Phase 1 acceptance criterion. Per §43, the output must be read and pasted into the phase report — not summarized.

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam
npm run lint;      echo "lint exit=$?"
npm run typecheck; echo "typecheck exit=$?"
npm test;          echo "test exit=$?"
npm run build;     echo "build exit=$?"
npm run test:e2e;  echo "e2e exit=$?"
npm run format:check; echo "format exit=$?"
```

Expected: every `exit=0`.

- [ ] **Step 4: Confirm no secret is tracked**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam
git ls-files | grep -E '^\.env' || echo "no .env files tracked"
git ls-files | grep -E '^\.env\.example$' && echo "OK: .env.example tracked"
```

Expected: `.env.example` is the only match. If `.env.local` appears, stop and remove it from the index before committing.

- [ ] **Step 5: Commit**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam
git add -A
git commit -m "docs: add vibejam readme and implementation plan

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

- [ ] **Step 6: Code review**

Per §4.1, run a review before the phase report — either a reviewer subagent (needs the project owner's go-ahead) or `/code-review` in-session. Address findings via `receiving-code-review`: verify each against the codebase before implementing, and push back with reasoning where a suggestion does not hold.

- [ ] **Step 7: Write the Phase 1 completion report**

Per §47, with all five required sections: **Completed**, **Files Added / Changed**, **Architecture Decisions**, **Verification Evidence** (the pasted output from Step 3), **External Setup Required**, and **Open Questions**.

External setup to call out for Phase 2:
- Create a Supabase project; copy the URL and anon key into `.env.local`
- Apply `supabase/migrations/0001_init_users.sql`
- Create a GitHub OAuth app; set the callback to `https://<ref>.supabase.co/auth/v1/callback`
- Enter the GitHub client ID and secret in Supabase → Authentication → Providers
- Create a GitHub PAT with public repo read scope for `GITHUB_TOKEN`

---

## Acceptance Criteria

Phase 1 is complete when, per §32 as amended:

> User can run the application locally and reach a working landing page, and all four of `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` exit 0 — with the output shown, per §43.

Plus, from §46, all fifteen initial items exist: Next.js project, TypeScript, Tailwind, ESLint, Prettier, shadcn/ui, directory structure, `.env.example`, `README.md`, `docs/IMPLEMENTATION_PLAN.md`, Supabase migration structure, shared types, validation structure, base layout, landing page, and authentication architecture that does not yet require production credentials.

## Out of Scope for Phase 1

Deferred deliberately — do not implement, and reject review suggestions that ask for them:

- Any OAuth flow, login page, session handling, or route protection → Phase 2
- Any Jam, challenge, submission, or scoring table or UI → Phases 3+
- Applying migrations to a live database → Phase 2
- Generated database types → Phase 2
- CI configuration → not in §3; do not add it
- Light mode → not in MVP (§24)
- Any component from `components/ui/` beyond `button` and `card`
