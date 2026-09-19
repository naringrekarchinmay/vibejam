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
 * This is a security control, not a convenience. `?next=` is attacker-
 * controllable, so without this an attacker could send a victim through a
 * genuine VibeJam sign-in and land them on a look-alike site holding a fresh
 * session — a classic open redirect used for credential phishing.
 *
 * Only same-origin absolute paths are allowed. Anything else falls back.
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next) return DEFAULT_SIGNED_IN_PATH;

  // Backslashes are normalised to slashes by some browsers, so "/\evil.com"
  // can resolve off-origin. Reject them outright rather than reasoning about
  // which browsers do what.
  if (next.includes("\\")) return DEFAULT_SIGNED_IN_PATH;

  // Must be a rooted path, and must not be protocol-relative ("//host"),
  // which the browser resolves against the current scheme.
  if (!next.startsWith("/") || next.startsWith("//")) return DEFAULT_SIGNED_IN_PATH;

  return next;
}
