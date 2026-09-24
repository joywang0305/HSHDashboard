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
  { id: "manila", name: "Manila", places: ["Manila"], timeZone: "Asia/Manila" },
  { id: "bangkok", name: "Bangkok", places: ["Bangkok"], timeZone: "Asia/Bangkok" },
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

export function offsetMinutes(offset: string): number {
  const match = offset.match(/([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3] ?? 0));
}

export function formatUtcOffset(minutes: number) {
  const sign = minutes < 0 ? "-" : "+";
  const abs = Math.abs(minutes);
  const hours = Math.floor(abs / 60);
  const mins = abs % 60;
  return mins
    ? `UTC${sign}${hours}:${String(mins).padStart(2, "0")}`
    : `UTC${sign}${hours}`;
}

export type CityClock = {
  city: WorldCity;
  clock: ZoneClock | null;
  minutes: number;
};

export type OffsetGroup = {
  offset: string;
  minutes: number;
  items: CityClock[];
};

export function citiesByOffset(now: Date): OffsetGroup[] {
  const items: CityClock[] = WORLD_CITIES.map((city) => {
    const clock = clockInZone(now, city.timeZone);
    return { city, clock, minutes: offsetMinutes(clock.offset) };
  });
  items.sort(
    (a, b) =>
      b.minutes - a.minutes ||
      Number(b.city.home) - Number(a.city.home) ||
      a.city.name.localeCompare(b.city.name),
  );
  const groups: OffsetGroup[] = [];
  for (const item of items) {
    const last = groups.at(-1);
    if (last && last.minutes === item.minutes) {
      last.items.push(item);
    } else {
      groups.push({
        offset: item.clock?.offset ?? formatUtcOffset(item.minutes),
        minutes: item.minutes,
        items: [item],
      });
    }
  }
  return groups;
}

export function offsetGroupRows(groups: OffsetGroup[], rows = 2): OffsetGroup[][] {
  const total = groups.reduce((count, group) => count + group.items.length, 0);
  const target = Math.ceil(total / rows);
  const result: OffsetGroup[][] = [];
  let current: OffsetGroup[] = [];
  let count = 0;
  for (const group of groups) {
    if (
      current.length &&
      count + group.items.length > target &&
      result.length < rows - 1
    ) {
      result.push(current);
      current = [];
      count = 0;
    }
    current.push(group);
    count += group.items.length;
  }
  if (current.length) result.push(current);
  return result;
}
