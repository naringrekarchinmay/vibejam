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
 * Builds an error naming the offending variables without echoing their values.
 * Env errors reach logs; the values are secrets (spec §25).
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
