import { describe, it, expect } from "vitest";
import { formatPersonName } from "./constants";

describe("formatPersonName", () => {
  it("normalizes shouted names", () => {
    expect(formatPersonName("Raul RIVELLES GARCIA")).toBe("Raul Rivelles Garcia");
  });

  it("handles lowercase, extra spaces, hyphens and apostrophes", () => {
    expect(formatPersonName("  maría   josé garcía-lópez ")).toBe("María José García-López");
    expect(formatPersonName("o'brien")).toBe("O'Brien");
  });

  it("passes caseless scripts through", () => {
    expect(formatPersonName("刘诗琪")).toBe("刘诗琪");
  });
});
