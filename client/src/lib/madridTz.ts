const MADRID_TZ = "Europe/Madrid";

// Parses "YYYY-MM-DDTHH:mm:ss" as a Madrid local timestamp and returns the
// corresponding UTC Date. DST transitions are handled automatically because
// the offset is computed from the input date, not assumed.
//
// Why this exists: `new Date("2026-04-26T13:30:00")` (no TZ suffix) is
// interpreted as the runtime's local TZ. Booking inputs in this app are
// always Madrid local, so a non-Madrid runtime (foreign admin, VPN, server)
// would silently shift the stored UTC by the offset delta.
function madridOffsetAt(instant: Date): number {
  // formatToParts + hourCycle h23 sidesteps a Node/ICU quirk where some
  // runtimes emit "24:00" (instead of "00:00") for midnight under hour12:false.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MADRID_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "00";
  const hour = get("hour") === "24" ? "00" : get("hour");
  const madridAsUtc = new Date(
    `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}:${get("second")}Z`,
  );
  return madridAsUtc.getTime() - instant.getTime();
}

export function parseMadridLocal(isoNaive: string): Date {
  const naiveAsUtc = new Date(`${isoNaive}Z`);
  if (isNaN(naiveAsUtc.getTime())) return naiveAsUtc;

  // Two-pass convergence: the offset at the wrong UTC guess can differ from
  // the offset at the actual target instant when the input lies near a DST
  // boundary. Recomputing once with the refined guess fixes that.
  const offset1 = madridOffsetAt(naiveAsUtc);
  const guess = new Date(naiveAsUtc.getTime() - offset1);
  const offset2 = madridOffsetAt(guess);
  return new Date(naiveAsUtc.getTime() - offset2);
}
