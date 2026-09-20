# Phase 2 — Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A user signs in with GitHub, lands on a protected dashboard showing their own profile, and can sign out — with the profile row created by the database trigger rather than by application code.

**Architecture:** Server-side PKCE OAuth through Supabase Auth. A Server Action starts the flow and returns a redirect to GitHub; a Route Handler exchanges the returned code for a session; the proxy refreshes that session on every request and gates protected routes. The two pieces of logic worth testing in isolation — which routes are protected, and which redirect targets are safe — are pure functions in `lib/auth/`.

**Tech Stack:** Next.js 16 App Router (Server Actions + Route Handlers) · `@supabase/ssr` 0.12.x · `@supabase/supabase-js` 2.x · Supabase Auth GitHub provider · Vitest · Playwright

**Spec:** §26 (Authentication), §25 (Security), §19 (`/login`, `/dashboard`), §32 Phase 2.

---

## Global Constraints

- **The repository is public.** Every pushed commit is published. No secret may enter a tracked file (§25, §29).
- **`GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` never enter this codebase.** They are configured in the Supabase dashboard; the app never reads them (§29).
- **RLS is the access boundary, not the UI** (§25).
- **`createServiceRoleClient` must not be used in this phase.** Nothing here legitimately bypasses RLS.
- **TDD is mandatory under `lib/`**, not required for pages, route handlers, or config (§4.1 resolution 2).
- **WCAG 2.2 AA** — visible focus, keyboard paths, contrast verified per pairing (`PRODUCT.md`).
- Dark theme only. Lime `--primary`, amber `--highlight`, neutral `--accent`.
- Commit at the end of every task. Conventional prefixes (§44).

---

## Task 0 — External setup (project owner, not the implementer)

**Blocking.** Tasks 1–5 can be written and unit-tested without this, but nothing can be
verified end to end until it is done, and Task 6 cannot start.

None of these values may be pasted into chat, a commit, or a tracked file.

- [ ] Create a Supabase project. From Settings → API copy into `.env.local`:
      Project URL → `NEXT_PUBLIC_SUPABASE_URL`, `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
      `service_role` → `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Create a GitHub OAuth app (Settings → Developer settings → OAuth Apps).
      Homepage `http://localhost:3000`; callback
      `https://<project-ref>.supabase.co/auth/v1/callback`
- [ ] Supabase → Authentication → Providers → GitHub: enable, paste the Client ID and
      Secret **there**
- [ ] Supabase → Authentication → URL Configuration: Site URL `http://localhost:3000`,
      redirect allow-list includes `http://localhost:3000/**`

---

## File Structure

| Path | Responsibility |
| --- | --- |
| `lib/auth/routes.ts` | `isProtectedRoute`, `safeNextPath` — pure, TDD'd |
| `lib/supabase/middleware.ts` | **modified**: returns the user alongside the response |
| `proxy.ts` | **modified**: redirects unauthenticated users away from protected routes |
| `app/login/page.tsx` | Sign-in screen |
| `app/login/actions.ts` | `signInWithGitHub` Server Action |
| `app/auth/callback/route.ts` | PKCE code → session exchange |
| `app/auth/auth-code-error/page.tsx` | Honest failure screen for a rejected exchange |
| `app/dashboard/page.tsx` | Protected; shows the signed-in profile |
| `app/dashboard/actions.ts` | `signOut` Server Action |
| `components/auth/sign-out-button.tsx` | Submit button bound to `signOut` |
| `types/database.ts` | **regenerated** in Task 6 |

---

## Task 1: Auth route rules (TDD)

Pure functions under `lib/`, so the Iron Law applies. `safeNextPath` is a security
control, not a convenience: without it `?next=` is an open redirect.

**Files:**
- Create: `lib/auth/routes.ts`, `tests/unit/lib/auth/routes.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `isProtectedRoute(pathname: string): boolean`
  - `safeNextPath(next: string | null | undefined): string`
  - `DEFAULT_SIGNED_IN_PATH: "/dashboard"`

- [ ] **Step 1: Write the failing test**

`tests/unit/lib/auth/routes.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { DEFAULT_SIGNED_IN_PATH, isProtectedRoute, safeNextPath } from "@/lib/auth/routes";

describe("isProtectedRoute", () => {
  it("protects the dashboard and everything under it", () => {
    expect(isProtectedRoute("/dashboard")).toBe(true);
    expect(isProtectedRoute("/dashboard/settings")).toBe(true);
  });

  it("protects jam routes", () => {
    expect(isProtectedRoute("/jam")).toBe(true);
    expect(isProtectedRoute("/jam/abc123")).toBe(true);
    expect(isProtectedRoute("/jam/abc123/submit")).toBe(true);
  });

  it("leaves public routes open", () => {
    expect(isProtectedRoute("/")).toBe(false);
    expect(isProtectedRoute("/login")).toBe(false);
    expect(isProtectedRoute("/auth/callback")).toBe(false);
    expect(isProtectedRoute("/join/ABCD1234")).toBe(false);
  });

  it("does not treat a longer sibling segment as protected", () => {
    // "/jamboree" starts with "/jam" but is a different route.
    expect(isProtectedRoute("/jamboree")).toBe(false);
    expect(isProtectedRoute("/dashboards")).toBe(false);
  });
});

describe("safeNextPath", () => {
  it("keeps a same-origin absolute path", () => {
    expect(safeNextPath("/dashboard")).toBe("/dashboard");
    expect(safeNextPath("/jam/abc123")).toBe("/jam/abc123");
  });

  it("falls back when absent", () => {
    expect(safeNextPath(null)).toBe(DEFAULT_SIGNED_IN_PATH);
    expect(safeNextPath(undefined)).toBe(DEFAULT_SIGNED_IN_PATH);
    expect(safeNextPath("")).toBe(DEFAULT_SIGNED_IN_PATH);
  });

  it("rejects absolute URLs to another origin", () => {
    expect(safeNextPath("https://evil.example")).toBe(DEFAULT_SIGNED_IN_PATH);
    expect(safeNextPath("http://evil.example/x")).toBe(DEFAULT_SIGNED_IN_PATH);
  });

  it("rejects protocol-relative URLs", () => {
    // "//evil.example" is a valid URL the browser resolves off-origin.
    expect(safeNextPath("//evil.example")).toBe(DEFAULT_SIGNED_IN_PATH);
  });

  it("rejects backslash variants browsers normalise to slashes", () => {
    expect(safeNextPath("/\\evil.example")).toBe(DEFAULT_SIGNED_IN_PATH);
    expect(safeNextPath("\\\\evil.example")).toBe(DEFAULT_SIGNED_IN_PATH);
  });

  it("rejects scheme-bearing values that are not paths", () => {
    expect(safeNextPath("javascript:alert(1)")).toBe(DEFAULT_SIGNED_IN_PATH);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam && npx vitest run tests/unit/lib/auth/routes.test.ts
```

Expected: FAIL — `Failed to resolve import "@/lib/auth/routes"`. Any other failure means something else is wrong; stop and read it.

- [ ] **Step 3: Write `lib/auth/routes.ts`**

```ts
/** Where a user lands after signing in with no specific destination. */
export const DEFAULT_SIGNED_IN_PATH = "/dashboard";

/**
 * Route prefixes that require a session. Matched on segment boundaries, so
 * "/jamboree" does not count as being under "/jam".
 */
const PROTECTED_PREFIXES = ["/dashboard", "/jam"] as const;

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Validates a post-sign-in redirect target.
 *
 * This is a security control. `?next=` is attacker-controllable, so without
 * this an attacker could send a victim through a genuine VibeJam sign-in and
 * land them on a look-alike site holding a fresh session — a classic open
 * redirect used for credential phishing.
 *
 * Only same-origin absolute paths are allowed. Anything else falls back.
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next) return DEFAULT_SIGNED_IN_PATH;

  // Backslashes are normalised to slashes by some browsers, so "/\evil.com"
  // can resolve off-origin. Reject them outright rather than reasoning about it.
  if (next.includes("\\")) return DEFAULT_SIGNED_IN_PATH;

  // Must be a rooted path, and must not be protocol-relative ("//host").
  if (!next.startsWith("/") || next.startsWith("//")) return DEFAULT_SIGNED_IN_PATH;

  return next;
}
```

- [ ] **Step 4: Run the test and watch it pass**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam && npx vitest run tests/unit/lib/auth/routes.test.ts
```

Expected: all assertions pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam
git add lib/auth/routes.ts tests/unit/lib/auth/routes.test.ts
git commit -m "feat: add auth route rules with open-redirect guard

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 2: Session refresh returns the user; proxy gates protected routes

**Files:**
- Modify: `lib/supabase/middleware.ts`, `proxy.ts`

**Interfaces:**
- Consumes: `isProtectedRoute` from `@/lib/auth/routes`.
- Produces: `updateSession(request: NextRequest): Promise<{ response: NextResponse; user: User | null }>` — **a breaking change to the existing signature**, which currently returns `NextResponse` alone. `proxy.ts` is its only caller.

**Design note.** The existing try/catch around `getUser()` stays. On a Supabase
outage the user resolves to `null`, so a signed-in visitor is redirected to
`/login` rather than the site returning 500 — degrade to logged-out, never to
down (§34). Protected pages re-check the session server-side, so the proxy is a
redirect for good UX, not the security boundary.

- [ ] **Step 1: Change `updateSession` to return the user**

In `lib/supabase/middleware.ts`, replace the closing section:

```ts
  // Touching getUser() is what triggers the token refresh. Do not remove.
  //
  // It must not be allowed to throw. This runs on nearly every request, so an
  // unguarded rejection during a Supabase outage or a misconfigured URL would
  // return 500 for every route — including the landing page and the public
  // results page, neither of which needs authentication at all. Failing to
  // refresh degrades a visitor to logged-out; failing open degrades the whole
  // site (§34).
  let user: User | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Swallowed deliberately: treated as signed-out. Protected pages re-check
    // the session themselves, so this cannot grant access.
  }

  return { response, user };
```

Add the type import at the top:

```ts
import type { User } from "@supabase/supabase-js";
```

- [ ] **Step 2: Gate protected routes in `proxy.ts`**

```ts
import { NextResponse, type NextRequest } from "next/server";

import { isProtectedRoute } from "@/lib/auth/routes";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);

  const { pathname, search } = request.nextUrl;

  if (isProtectedRoute(pathname) && !user) {
    const loginUrl = new URL("/login", request.url);
    // Preserve where they were heading so sign-in can return them there.
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

- [ ] **Step 3: Verify the gate redirects**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam && npm run dev
```

In a second shell:

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/dashboard
```

Expected: `307 http://localhost:3000/login?next=%2Fdashboard`. A `200` means the
gate is not firing; a `500` means `updateSession`'s new shape broke its caller.

- [ ] **Step 4: Confirm public routes are untouched**

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/
```

Expected: `200`.

- [ ] **Step 5: Commit the gate as a test, not just a curl**

The curl checks above prove it works now; this proves it keeps working.
`tests/e2e/auth.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("signed-out visitor is redirected away from the dashboard", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("the intended destination is preserved for after sign-in", async ({ page }) => {
  await page.goto("/dashboard");
  expect(new URL(page.url()).searchParams.get("next")).toBe("/dashboard");
});

test("public routes stay reachable without a session", async ({ page }) => {
  const landing = await page.goto("/");
  expect(landing?.status()).toBe(200);

  const login = await page.goto("/login");
  expect(login?.status()).toBe(200);
});

test("a sibling route that merely shares a prefix is not gated", async ({ page }) => {
  // "/jamboree" starts with "/jam" but must not be treated as protected.
  // It 404s because no such route exists — the point is that it is NOT a
  // redirect to /login.
  const response = await page.goto("/jamboree");
  expect(response?.status()).toBe(404);
  expect(page.url()).not.toContain("/login");
});
```

- [ ] **Step 6: Run it**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam && npx playwright test tests/e2e/auth.spec.ts
```

Expected: 4 passed. The last test will fail if `isProtectedRoute` ever loses its
segment-boundary check — which is exactly the regression it exists to catch.

- [ ] **Step 7: Gates and commit**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam
npm run lint && npm run typecheck && npm test && npm run build && npm run test:e2e
git add lib/supabase/middleware.ts proxy.ts tests/e2e/auth.spec.ts
git commit -m "feat: gate protected routes on an authenticated session

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 3: `/login` page and the sign-in action

**Files:**
- Create: `app/login/page.tsx`, `app/login/actions.ts`

**Interfaces:**
- Consumes: `createServerSupabaseClient` from `@/lib/supabase/server`; `publicEnv` from `@/lib/env`; `safeNextPath` from `@/lib/auth/routes`; `Button` from `@/components/ui/button`.
- Produces: `signInWithGitHub(formData: FormData): Promise<never>` — a Server Action that always redirects.

- [ ] **Step 1: Write `app/login/actions.ts`**

```ts
"use server";

import { redirect } from "next/navigation";

import { safeNextPath } from "@/lib/auth/routes";
import { publicEnv } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function signInWithGitHub(formData: FormData) {
  const next = safeNextPath(formData.get("next")?.toString());
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      // Supabase returns the user here with a PKCE code. The verifier is held
      // in a cookie set by the call above, which is why this runs server-side.
      redirectTo: `${publicEnv.NEXT_PUBLIC_APP_URL}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) {
    redirect("/auth/auth-code-error");
  }

  redirect(data.url);
}
```

- [ ] **Step 2: Write `app/login/page.tsx`**

```tsx
import Link from "next/link";

import { signInWithGitHub } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { safeNextPath } from "@/lib/auth/routes";

export const metadata = {
  title: "Sign in — VibeJam",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNextPath(
    Array.isArray(params.next) ? params.next[0] : params.next,
  );

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-4 py-12">
      <div className="flex flex-col gap-3">
        <Link href="/" className="display w-fit text-lg tracking-[-0.02em]">
          VibeJam
        </Link>
        <h1 className="display text-3xl">Sign in</h1>
        <p className="text-muted-foreground text-pretty">
          VibeJam uses your GitHub account to identify you and to read the repositories you
          submit. It never posts on your behalf.
        </p>
      </div>

      <form action={signInWithGitHub}>
        <input type="hidden" name="next" value={next} />
        <Button type="submit" size="lg" className="w-full">
          Continue with GitHub
        </Button>
      </form>

      <p className="text-muted-foreground text-xs text-pretty">
        Submitted repositories must be public. VibeJam reads code to judge it and never runs it.
      </p>
    </main>
  );
}
```

> **On `PageProps<"/login">`.** Like `LayoutProps`, this is generated by
> `next typegen` from the routes that exist on disk. It only resolves once
> `app/login/page.tsx` is present, so run `npm run typecheck` (which runs typegen
> first) rather than bare `tsc` — a bare `tsc` on a cold checkout will report the
> type as missing and send you hunting for an import that does not exist.

- [ ] **Step 3: Verify it renders and is keyboard-reachable**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam && npm run dev
```

Open `http://localhost:3000/login`. Tab to the button and confirm the lime focus
ring with its offset is visible. Clicking it will fail until Task 0 and Task 4
are done — that is expected at this point.

- [ ] **Step 4: Gates and commit**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam
npm run lint && npm run typecheck && npm test && npm run build
git add app/login
git commit -m "feat: add login page and github sign-in action

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 4: OAuth callback and its failure screen

**Files:**
- Create: `app/auth/callback/route.ts`, `app/auth/auth-code-error/page.tsx`

**Interfaces:**
- Consumes: `createServerSupabaseClient`, `safeNextPath`.
- Produces: the `GET /auth/callback` route. No module exports other code imports.

- [ ] **Step 1: Write `app/auth/callback/route.ts`**

```ts
import { NextResponse, type NextRequest } from "next/server";

import { safeNextPath } from "@/lib/auth/routes";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Completes the PKCE flow: Supabase redirects here with a one-time code, which
 * is exchanged for a session using the verifier stored in a cookie.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  // GitHub or Supabase can return an error instead of a code — for instance
  // when the user declines authorization on the consent screen.
  if (searchParams.get("error") || !code) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
```

- [ ] **Step 2: Write `app/auth/auth-code-error/page.tsx`**

The screen must not claim to know why it failed, because it does not (§40's
honesty rule applied to error states).

```tsx
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Sign-in failed — VibeJam",
};

export default function AuthCodeErrorPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-4 py-12">
      <h1 className="display text-3xl">Sign-in didn&apos;t complete</h1>

      <p className="text-muted-foreground text-pretty">
        GitHub sent us back without a usable sign-in code. That usually means the request was
        declined, or it sat long enough for the code to expire.
      </p>

      <div className="flex gap-3">
        <Button asChild size="lg">
          <Link href="/login">Try again</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Verify the no-code path**

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" "http://localhost:3000/auth/callback"
```

Expected: `307 http://localhost:3000/auth/auth-code-error`. This is the branch
reachable without any Supabase credentials, so verify it now rather than assuming.

- [ ] **Step 4: Verify the error page renders**

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/auth/auth-code-error
```

Expected: `200`.

- [ ] **Step 5: Gates and commit**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam
npm run lint && npm run typecheck && npm test && npm run build
git add app/auth
git commit -m "feat: add oauth callback and sign-in failure screen

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 5: Protected dashboard and sign-out

**Files:**
- Create: `app/dashboard/page.tsx`, `app/dashboard/actions.ts`, `components/auth/sign-out-button.tsx`

**Interfaces:**
- Consumes: `createServerSupabaseClient`, `UserRow` from `@/types/database`, `Button`.
- Produces: `signOut(): Promise<never>` Server Action; `SignOutButton` component.

**Design note.** The page re-checks the session with `getUser()` rather than
trusting the proxy. The proxy is UX; this is the boundary (§25).

- [ ] **Step 1: Write `app/dashboard/actions.ts`**

```ts
"use server";

import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}
```

- [ ] **Step 2: Write `components/auth/sign-out-button.tsx`**

```tsx
import { signOut } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <Button type="submit" variant="outline" size="sm">
        Sign out
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: Write `app/dashboard/page.tsx`**

```tsx
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Dashboard — VibeJam",
};

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();

  // Re-checked here rather than trusting the proxy. The proxy redirect is for
  // UX; this is the access boundary (§25).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=%2Fdashboard");

  // RLS restricts this to the caller's own row (migration 0001).
  const { data: profile } = await supabase
    .from("users")
    .select("github_username, display_name, avatar_url")
    .eq("id", user.id)
    .single();

  const name = profile?.display_name ?? profile?.github_username ?? "there";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col gap-10 px-4 py-12">
      <header className="flex items-center justify-between gap-4">
        <span className="display text-lg tracking-[-0.02em]">VibeJam</span>
        <SignOutButton />
      </header>

      <div className="flex flex-col gap-2">
        <h1 className="display text-3xl">Hello, {name}</h1>
        {profile ? (
          <p className="numeric text-muted-foreground text-sm">@{profile.github_username}</p>
        ) : (
          <p className="text-muted-foreground text-sm text-pretty">
            Your profile hasn&apos;t synced yet. Signing out and back in will create it.
          </p>
        )}
      </div>

      <section className="border-border rounded-xl border border-dashed p-8 text-center">
        <p className="text-muted-foreground text-pretty">
          Jams appear here once Jam creation ships in Phase 3.
        </p>
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Gates and commit**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam
npm run lint && npm run typecheck && npm test && npm run build
git add app/dashboard components/auth
git commit -m "feat: add protected dashboard and sign-out

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 6: Apply the migration and verify the live flow

**Requires Task 0.** This is the task that discharges Phase 1's largest piece of
debt: `0001_init_users.sql` has never touched a database.

- [ ] **Step 1: Link the project and apply migrations**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam && npx supabase link --project-ref <ref>
```

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam && npx supabase db push
```

Expected: `0001_init_users.sql` applies with no error. **If it fails, that is the
real finding** — the Phase 1 parse check could not catch plpgsql body errors,
unresolved references to `auth.users`, or insufficient trigger privileges. Fix
the migration, do not work around it.

- [ ] **Step 2: Regenerate the database types**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam && npx supabase gen types typescript --linked > types/database.ts
```

This also clears the Insert-type finding from the Phase 1 code review: generated
types mark nullable columns optional on insert.

- [ ] **Step 3: Typecheck against the real schema**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam && npm run typecheck
```

Expected: exit 0. Failures here are genuine mismatches between the hand-written
types and the real schema — fix the call sites, not the generated file.

- [ ] **Step 4: Sign in for real**

Start the dev server, open `http://localhost:3000/login`, and complete GitHub
authorization. Expected: you land on `/dashboard` showing your GitHub username.

- [ ] **Step 5: Confirm the trigger created the profile**

In the Supabase SQL editor:

```sql
select id, github_id, github_username, display_name, avatar_url, created_at, updated_at
from public.users;
```

Expected: exactly one row, matching your GitHub account.

- [ ] **Step 6: Confirm the trigger fires on metadata change, not only insert**

This verifies the Phase 1 review fix. Change your GitHub display name, then sign
out and back in. Re-run the query.

Expected: `display_name` reflects the new value and `updated_at` has advanced. If
it has not, the `after insert or update of raw_user_meta_data` trigger is not
firing and the profile will stay stale forever — a real bug, not a cosmetic one.

- [ ] **Step 7: Confirm RLS actually restricts reads**

In the SQL editor, which runs as a privileged role, confirm the policy exists:

```sql
select polname, polcmd from pg_policy where polrelid = 'public.users'::regclass;
```

Expected: `users_select_own` and `users_update_own`.

- [ ] **Step 8: Confirm sign-out clears the session**

Click Sign out. Expected: redirected to `/login`. Then:

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/dashboard
```

Expected: `307 .../login?next=%2Fdashboard`.

- [ ] **Step 9: Commit the regenerated types**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam
git add types/database.ts
git commit -m "chore: regenerate database types from the live schema

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 7: Docs, review, and the phase report

- [ ] **Step 1: Update `docs/IMPLEMENTATION_PLAN.md`** — tick Phase 2, and move
      any Phase 1 debt that Task 6 discharged out of the carried list.

- [ ] **Step 2: Update `README.md`** — Status becomes Phase 2; remove "`/login`
      does not exist; both landing CTAs 404" and "the migration has never been
      applied" from Current limitations, assuming Task 6 discharged them.

- [ ] **Step 3: Run the full gate set and read the output**

```bash
cd /Users/chinmaynaringrekar/Projects/VibeJam
npm run lint; npm run typecheck; npm test; npm run build; npm run test:e2e; npm run format:check
```

- [x] **Step 4: Security review** — done 2026-09-20, after Tasks 1-5. **No findings.**

Note: `/security-review` reviews the diff against `origin/HEAD`, which was unset
on the freshly created repo (now fixed with `git remote set-head origin -a`).
With everything pushed the diff is empty, so the audit below was run
deliberately over the auth surface instead.

What was checked and what it showed:

| Check | Result |
| --- | --- |
| Service-role client reachable from a request path | Never called; only defined |
| `safeNextPath` applied at every attacker-controlled entry | All three: login page, sign-in action, callback |
| `getSession()` used anywhere in place of `getUser()` | No. Only `getUser()`, which validates against the auth server rather than trusting the cookie |
| Profile read relies on RLS alone | No — also scoped with `.eq("id", user.id)`, so a policy regression does not immediately leak |
| Error screens leak internals | No. The failure page states what is known and does not guess a cause |

One hypothesis was tested and **rejected**: the callback builds its redirect from
`request.nextUrl.origin`, which in principle derives from the Host header, so
Host injection could have redirected a freshly signed-in user off-origin.
Spoofing both `Host:` and `X-Forwarded-Host:` against the running server left
the redirect at `localhost:3000`. Not reproducible, so not changed — and
deliberately still using `origin` rather than the configured app URL, because
pinning the canonical origin would break redirects on Vercel preview
deployments.

Re-run this review after Task 6, when a real session exists: the checks above
all ran against the signed-out paths.

- [ ] **Step 5: Code review**, then the §47 report with all six sections and the
      pasted verification output.

---

## Acceptance Criteria

> User can sign in with GitHub and reach their dashboard.

Concretely: a signed-out visitor hitting `/dashboard` is redirected to `/login`
with `next` preserved; signing in with GitHub lands them on `/dashboard` showing
their GitHub username; `public.users` holds exactly one matching row created by
the trigger; signing out returns them to `/login` and re-protects `/dashboard`.

## Out of Scope

Reject review suggestions asking for these — they belong to later phases:

- Any Jam, challenge, submission or scoring table, route, or UI → Phases 3+
- Email/password, magic links, or any provider other than GitHub → not in §3
- Profile editing → not in §3
- Storing the GitHub `provider_token` for private repo access → §16 rules it out
- Role or permission systems beyond "signed in" → not in §3
- CI → Phase 13
