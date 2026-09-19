import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { JudgedResult } from "@/components/landing/judged-result";

describe("JudgedResult", () => {
  it("ranks participants highest score first", () => {
    render(<JudgedResult />);

    const names = screen.getAllByRole("listitem").map((el) => el.textContent);
    expect(names[0]).toContain("Chinmay");
    expect(names[1]).toContain("Alex");
    expect(names[2]).toContain("Sam");
  });

  it("states the requirement status as a word, not only a color", () => {
    render(<JudgedResult />);
    expect(screen.getByText("PASS")).toBeInTheDocument();
  });

  it("cites the file that earned the score", () => {
    render(<JudgedResult />);
    expect(screen.getByText("src/lib/storage.ts")).toBeInTheDocument();
  });

  it("exposes each score to assistive tech as a settled value", () => {
    render(<JudgedResult />);
    expect(screen.getByText("88 out of 100")).toBeInTheDocument();
  });
});
