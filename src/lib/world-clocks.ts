export type WorldCity = {
  id: string;
  name: string;
  places: string[];
  timeZone: string;
  home?: boolean;
};

export const WORLD_CITIES: WorldCity[] = [
  { id: "tokyo", name: "Tokyo", places: ["Tokyo"], timeZone: "Asia/Tokyo" },
  {
    id: "hk-sh-bj",
    name: "Hong Kong",
    places: ["Shanghai", "Beijing"],
    timeZone: "Asia/Hong_Kong",
    home: true,
  },
  { id: "bangkok", name: "Bangkok", places: ["Bangkok"], timeZone: "Asia/Bangkok" },
  { id: "manila", name: "Manila", places: ["Manila"], timeZone: "Asia/Manila" },
  {
    id: "istanbul",
    name: "Istanbul",
    places: ["Istanbul"],
    timeZone: "Europe/Istanbul",
  },
  { id: "paris", name: "Paris", places: ["Paris"], timeZone: "Europe/Paris" },
  { id: "london", name: "London", places: ["London"], timeZone: "Europe/London" },
  {
    id: "newyork",
    name: "New York",
    places: ["New York"],
    timeZone: "America/New_York",
  },
  {
    id: "chicago",
    name: "Chicago",
    places: ["Chicago"],
    timeZone: "America/Chicago",
  },
  {
    id: "la",
    name: "Los Angeles",
    places: ["Los Angeles"],
    timeZone: "America/Los_Angeles",
  },
];

export type ZoneClock = {
  hour: number;
  minute: number;
  second: number;
  digital: string;
  weekday: string;
  date: string;
  offset: string;
};

function part(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
) {
  return parts.find((item) => item.type === type)?.value ?? "";
}

export function clockInZone(now: Date, timeZone: string): ZoneClock {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZoneName: "shortOffset",
  }).formatToParts(now);

  const hour = Number(part(parts, "hour") || "0");
  const minute = Number(part(parts, "minute") || "0");
  const second = Number(part(parts, "second") || "0");
  const offset = part(parts, "timeZoneName").replace("GMT", "UTC");
  const hour12 = hour % 12 || 12;
  const meridiem = hour < 12 ? "AM" : "PM";

  return {
    hour,
    minute,
    second,
    digital: `${hour12}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")} ${meridiem}`,
    weekday: part(parts, "weekday"),
    date: `${part(parts, "day")} ${part(parts, "month")}`,
    offset: offset || "UTC",
  };
}
