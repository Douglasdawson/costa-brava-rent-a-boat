import { describe, it, expect } from "vitest";
import { exceedsCapacity } from "./inquiries";

// A booking request for more people than the boat holds reached WhatsApp and the CRM
// (Astec 480, 5 seats, requested for 6). The wizard now blocks it; this is the server net.
describe("exceedsCapacity", () => {
  it("rejects a group larger than the single boat", () => {
    expect(exceedsCapacity([{ capacity: 5 }], 6)).toBe(true);
  });

  it("accepts a group that exactly fills the boat", () => {
    expect(exceedsCapacity([{ capacity: 5 }], 5)).toBe(false);
  });

  it("adds up capacities on multi-boat requests", () => {
    expect(exceedsCapacity([{ capacity: 5 }, { capacity: 5 }], 10)).toBe(false);
    expect(exceedsCapacity([{ capacity: 5 }, { capacity: 5 }], 11)).toBe(true);
  });

  it("lets an unknown boat through rather than dropping the lead", () => {
    expect(exceedsCapacity([undefined], 12)).toBe(false);
    expect(exceedsCapacity([{ capacity: 5 }, undefined], 12)).toBe(false);
  });
});
