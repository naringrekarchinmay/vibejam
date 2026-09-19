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
