import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("createServiceRoleClient", () => {
  it("can be imported with no server secrets present", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("GITHUB_TOKEN", "");
    vi.stubEnv("OPENAI_API_KEY", "");

    // The import itself must not throw. If the secret were read at module
    // scope, `next build` would fail the moment any file imported this.
    const mod = await import("@/lib/supabase/server");
    expect(typeof mod.createServiceRoleClient).toBe("function");
  });

  it("throws naming the missing variable when actually called", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("GITHUB_TOKEN", "");
    vi.stubEnv("OPENAI_API_KEY", "");

    const { createServiceRoleClient } = await import("@/lib/supabase/server");
    expect(() => createServiceRoleClient()).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("does not leak the secret value in the error", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("GITHUB_TOKEN", "super-secret-token");
    vi.stubEnv("OPENAI_API_KEY", "sk-super-secret");

    const { createServiceRoleClient } = await import("@/lib/supabase/server");
    try {
      createServiceRoleClient();
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(String(error)).not.toContain("super-secret-token");
      expect(String(error)).not.toContain("sk-super-secret");
    }
  });
});
