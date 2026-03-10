// Shared booking form validation utilities
// Used by BookingFormWidget (inline validation) and potentially BookingFlow

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_DIGITS_REGEX = /^\d+$/;
const MIN_PHONE_LENGTH = 6;

/**
 * Validates an email address. Returns null if valid, error key if invalid.
 * Email is required for booking confirmation delivery.
 */
export function validateEmail(email: string): "required" | "invalid" | null {
  if (!email.trim()) return "required";
  if (!EMAIL_REGEX.test(email)) return "invalid";
  return null;
}

/**
 * Returns true if the email string is valid or empty.
 * Convenience wrapper for use in boolean expressions.
 */
export function isValidEmail(email: string): boolean {
  return validateEmail(email) === null;
}

/**
 * Validates a phone number (digits only, minimum length).
 * Returns null if valid, "required" if empty, "invalid" if bad format.
 */
export function validatePhone(phone: string): "required" | "invalid" | null {
  const trimmed = phone.trim();
  if (!trimmed) return "required";
  if (!PHONE_DIGITS_REGEX.test(trimmed)) return "invalid";
  if (trimmed.length < MIN_PHONE_LENGTH) return "invalid";
  return null;
}

/**
 * Validates a required text field is not empty.
 * Returns "required" if empty, null if valid.
 */
export function validateRequired(value: string): "required" | null {
  return value.trim() ? null : "required";
}

/**
 * Validates a booking date is not in the past.
 * todayISO should be in YYYY-MM-DD format (local timezone).
 * Returns null if valid, "required" if empty, "past" if in the past.
 */
export function validateBookingDate(dateString: string, todayISO: string): "required" | "past" | null {
  if (!dateString) return "required";
  if (dateString < todayISO) return "past";
  return null;
}

/**
 * Returns today's date as a local YYYY-MM-DD string.
 * Avoids timezone issues that new Date().toISOString().split('T')[0] causes.
 */
export function getLocalISODate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
