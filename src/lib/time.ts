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
  const desired = `${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
  let utc = new Date(`${desired}Z`);
  for (let index = 0; index < 3; index += 1) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(utc);
    const value = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value ?? "00";
    const shown = `${value("year")}-${value("month")}-${value("day")}T${value("hour")}:${value("minute")}:${value("second")}`;
    const delta =
      new Date(`${desired}Z`).getTime() - new Date(`${shown}Z`).getTime();
    utc = new Date(utc.getTime() + delta);
    if (delta === 0) break;
  }
  return utc;
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

export function isIsoDate(value: string | null | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const probe = new Date(Date.UTC(year, month - 1, day));
  return (
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day
  );
}

export function shiftDate(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return [
    next.getUTCFullYear(),
    String(next.getUTCMonth() + 1).padStart(2, "0"),
    String(next.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export function dateOfInstant(iso: string, timeZone = TIMEZONE) {
  return todayInZone(timeZone, new Date(iso));
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
