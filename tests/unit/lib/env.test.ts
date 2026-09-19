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
    const missing = {
      SUPABASE_SERVICE_ROLE_KEY: valid.SUPABASE_SERVICE_ROLE_KEY,
      OPENAI_API_KEY: valid.OPENAI_API_KEY,
    };
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
