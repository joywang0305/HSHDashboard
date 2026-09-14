export const DAY_START_HOUR = 7;
export const DAY_END_HOUR = 19;
export const SLOT_MINUTES = 30;
export const POLL_MS = 12_000;
export const CLOCK_MS = 15_000;
export const TIMEZONE =
  process.env.NEXT_PUBLIC_HSH_TIMEZONE ??
  process.env.HSH_TIMEZONE ??
  "Asia/Hong_Kong";

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

export function minutesFromMidnight(iso: string, timeZone = TIMEZONE) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(
    parts.find((part) => part.type === "minute")?.value ?? "0",
  );
  return hour * 60 + minute;
}

export function formatClock(iso: string, timeZone = TIMEZONE) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

export function formatNumericDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export function formatDayLabel(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return `${WEEKDAYS[weekday]}, ${day} ${MONTHS[month - 1]} ${year}`;
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

export function formatMinutesClock(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function slotStartMinutes(durationMinutes: number) {
  const last = DAY_END_HOUR * 60 - durationMinutes;
  const starts: number[] = [];
  for (
    let minutes = DAY_START_HOUR * 60;
    minutes <= last;
    minutes += SLOT_MINUTES
  ) {
    starts.push(minutes);
  }
  return starts;
}

/** Next 30-minute board slot on `date`, or null when none remain today. */
export function nextBookableStartMinutes(
  now: Date,
  date: string,
  durationMinutes: number,
  timeZone = TIMEZONE,
) {
  const starts = slotStartMinutes(durationMinutes);
  if (starts.length === 0) return null;
  const today = todayInZone(timeZone, now);
  if (date < today) return null;
  if (date > today) return starts[0];
  const nowMinutes = minutesFromMidnight(now.toISOString(), timeZone);
  const snapped =
    Math.ceil(nowMinutes / SLOT_MINUTES) * SLOT_MINUTES;
  const start = starts.find((item) => item >= snapped) ?? null;
  return start;
}
