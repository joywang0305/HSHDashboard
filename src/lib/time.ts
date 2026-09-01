export const DAY_START_HOUR = 7;
export const DAY_END_HOUR = 19;
export const SLOT_MINUTES = 30;
export const POLL_MS = 12_000;
export const TIMEZONE =
  process.env.HSH_TIMEZONE ?? "Pacific/Auckland";

export function todayInZone(timeZone = TIMEZONE, from = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(from);
}

export function zonedDateTime(date: string, hour: number, minute = 0) {
  const padded = `${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
  return new Date(padded);
}

export function minutesFromMidnight(iso: string) {
  const date = new Date(iso);
  return date.getHours() * 60 + date.getMinutes();
}

export function formatClock(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDayLabel(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

export function formatShortDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

export function rangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
) {
  return new Date(startA) < new Date(endB) && new Date(startB) < new Date(endA);
}

export function addMinutes(iso: string, minutes: number) {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

export function isoFromDateAndMinutes(date: string, minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return zonedDateTime(date, hours, mins).toISOString();
}
