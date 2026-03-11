import { describe, it, expect } from "vitest";
import {
  validateEmail,
  isValidEmail,
  validatePhone,
  validateRequired,
  validateBookingDate,
  getLocalISODate,
} from "./booking-validation";

describe("validateEmail", () => {
  it("returns null for valid email", () => {
    expect(validateEmail("user@example.com")).toBeNull();
    expect(validateEmail("test.name+tag@domain.co")).toBeNull();
  });

  it("returns 'required' for empty or whitespace", () => {
    expect(validateEmail("")).toBe("required");
    expect(validateEmail("   ")).toBe("required");
  });

  it("returns 'invalid' for malformed emails", () => {
    expect(validateEmail("notanemail")).toBe("invalid");
    expect(validateEmail("missing@")).toBe("invalid");
    expect(validateEmail("@nodomain.com")).toBe("invalid");
    expect(validateEmail("spaces in@email.com")).toBe("invalid");
  });
});

describe("isValidEmail", () => {
  it("returns true for valid email", () => {
    expect(isValidEmail("a@b.com")).toBe(true);
  });

  it("returns false for invalid email", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("bad")).toBe(false);
  });
});

describe("validatePhone", () => {
  it("returns null for valid phone numbers", () => {
    expect(validatePhone("612345678")).toBeNull();
    expect(validatePhone("123456")).toBeNull();
  });

  it("returns 'required' for empty", () => {
    expect(validatePhone("")).toBe("required");
    expect(validatePhone("  ")).toBe("required");
  });

  it("returns 'invalid' for non-digit characters", () => {
    expect(validatePhone("abc")).toBe("invalid");
    expect(validatePhone("+34612")).toBe("invalid");
    expect(validatePhone("612-345")).toBe("invalid");
  });

  it("returns 'invalid' for too-short phone numbers", () => {
    expect(validatePhone("123")).toBe("invalid");
    expect(validatePhone("12345")).toBe("invalid");
  });
});

describe("validateRequired", () => {
  it("returns null for non-empty strings", () => {
    expect(validateRequired("hello")).toBeNull();
    expect(validateRequired(" x ")).toBeNull();
  });

  it("returns 'required' for empty or whitespace", () => {
    expect(validateRequired("")).toBe("required");
    expect(validateRequired("   ")).toBe("required");
  });
});

describe("validateBookingDate", () => {
  it("returns null for today or future date", () => {
    expect(validateBookingDate("2026-06-15", "2026-06-15")).toBeNull();
    expect(validateBookingDate("2026-12-01", "2026-06-15")).toBeNull();
  });

  it("returns 'required' for empty date", () => {
    expect(validateBookingDate("", "2026-06-15")).toBe("required");
  });

  it("returns 'past' for past dates", () => {
    expect(validateBookingDate("2026-01-01", "2026-06-15")).toBe("past");
    expect(validateBookingDate("2025-12-31", "2026-01-01")).toBe("past");
  });
});

describe("getLocalISODate", () => {
  it("returns a YYYY-MM-DD formatted string", () => {
    const result = getLocalISODate();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("matches today's date components", () => {
    const result = getLocalISODate();
    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    expect(result).toBe(expected);
  });
});
