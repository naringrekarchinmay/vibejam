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
