import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProductLoop } from "@/components/landing/product-loop";

describe("ProductLoop", () => {
  it("renders every stage of the product loop in order", () => {
    render(<ProductLoop />);

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

  it("marks the sequence up as an ordered list", () => {
    const { container } = render(<ProductLoop />);
    expect(container.querySelector("ol")).not.toBeNull();
  });
});
