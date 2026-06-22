import { format, formatDistanceToNow } from "date-fns";

type DateInput = Date | string | number | null | undefined;

function toValidDate(input: DateInput): Date | null {
  if (input === null || input === undefined) return null;
  const date = input instanceof Date ? input : new Date(input);
  return isNaN(date.getTime()) ? null : date;
}

// date-fns `format`/`formatDistanceToNow` throw `RangeError: Invalid time value`
// when handed an invalid Date. A single bad row (e.g. a booking with a null
// startTime) would otherwise crash the entire CRM view. These wrappers return a
// fallback string instead of throwing.

export function safeFormat(
  input: DateInput,
  formatStr: string,
  options?: Parameters<typeof format>[2],
  fallback = "—",
): string {
  const date = toValidDate(input);
  if (!date) return fallback;
  try {
    return format(date, formatStr, options);
  } catch {
    return fallback;
  }
}

export function safeFormatDistanceToNow(
  input: DateInput,
  options?: Parameters<typeof formatDistanceToNow>[1],
  fallback = "—",
): string {
  const date = toValidDate(input);
  if (!date) return fallback;
  try {
    return formatDistanceToNow(date, options);
  } catch {
    return fallback;
  }
}
