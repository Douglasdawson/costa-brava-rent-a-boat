import { describe, it, expect, vi, beforeEach } from "vitest";
import { CircuitBreaker } from "./circuitBreaker";

// Mock logger to avoid side effects
vi.mock("./logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

describe("CircuitBreaker", () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker("test", 3, 5000);
  });

  it("passes through successful calls in CLOSED state", async () => {
    const result = await breaker.call(() => Promise.resolve("ok"));
    expect(result).toBe("ok");
  });

  it("passes through errors without opening until threshold", async () => {
    const fail = () => Promise.reject(new Error("fail"));

    // First 2 failures should still allow calls
    await expect(breaker.call(fail)).rejects.toThrow("fail");
    await expect(breaker.call(fail)).rejects.toThrow("fail");

    // Third failure opens the circuit
    await expect(breaker.call(fail)).rejects.toThrow("fail");

    // Now the circuit is OPEN — next call should be rejected immediately
    await expect(breaker.call(() => Promise.resolve("ok"))).rejects.toThrow("Circuit breaker test is OPEN");
  });

  it("resets failure count on successful call", async () => {
    const fail = () => Promise.reject(new Error("fail"));

    await expect(breaker.call(fail)).rejects.toThrow();
    await expect(breaker.call(fail)).rejects.toThrow();

    // Success resets the counter
    const result = await breaker.call(() => Promise.resolve("recovered"));
    expect(result).toBe("recovered");

    // Two more failures should not open (counter was reset)
    await expect(breaker.call(fail)).rejects.toThrow();
    await expect(breaker.call(fail)).rejects.toThrow();

    // Should still be CLOSED
    const result2 = await breaker.call(() => Promise.resolve("still-ok"));
    expect(result2).toBe("still-ok");
  });

  it("transitions to HALF_OPEN after cooldown and closes on success", async () => {
    const fail = () => Promise.reject(new Error("fail"));

    // Open the circuit
    for (let i = 0; i < 3; i++) {
      await expect(breaker.call(fail)).rejects.toThrow("fail");
    }

    // Advance time past cooldown
    vi.useFakeTimers();
    vi.advanceTimersByTime(6000);

    // Should allow one probe call (HALF_OPEN)
    const result = await breaker.call(() => Promise.resolve("back"));
    expect(result).toBe("back");

    // Circuit should now be CLOSED — further calls succeed
    const result2 = await breaker.call(() => Promise.resolve("stable"));
    expect(result2).toBe("stable");

    vi.useRealTimers();
  });

  it("returns to OPEN if probe call fails in HALF_OPEN", async () => {
    const fail = () => Promise.reject(new Error("fail"));

    // Open circuit
    for (let i = 0; i < 3; i++) {
      await expect(breaker.call(fail)).rejects.toThrow("fail");
    }

    // Advance past cooldown
    vi.useFakeTimers();
    vi.advanceTimersByTime(6000);

    // Probe call fails
    await expect(breaker.call(fail)).rejects.toThrow("fail");

    // Circuit should be OPEN again (failures >= threshold)
    await expect(breaker.call(() => Promise.resolve("ok"))).rejects.toThrow("Circuit breaker test is OPEN");

    vi.useRealTimers();
  });
});
