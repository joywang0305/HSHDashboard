import { seedBookings, seedHub, seedInUseRoomIds, seedRooms, seedSharePoint } from "@/lib/seed";
import { resolveKioskFloor } from "@/lib/floor-plan";
import {
  cachedSgbRooms,
  clearGraphCache,
  fetchSgbOutlookBookings,
  fetchSgbOutlookRooms,
  graphCredentialsPresent,
} from "@/lib/graph";
import { dateOfInstant, isIsoDate, rangesOverlap, todayInZone } from "@/lib/time";
import type {
  BoardPayload,
  Booking,
  CreateBookingInput,
  Room,
} from "@/lib/types";
import { DAY_END_HOUR, DAY_START_HOUR, TIMEZONE } from "@/lib/time";

export function isGraphConfigured() {
  return graphCredentialsPresent();
}

type BoardState = {
  rooms: ReturnType<typeof seedRooms>;
  bookings: Booking[];
  hub: ReturnType<typeof seedHub>;
  sharepoint: ReturnType<typeof seedSharePoint>;
  date: string;
};

const globalState = globalThis as typeof globalThis & {
  __hshBoard?: BoardState;
};

function createState(): BoardState {
  const date = process.env.BOARD_DATE ?? todayInZone();
  return {
    rooms: seedRooms(),
    bookings: seedBookings(date),
    hub: seedHub(),
    sharepoint: seedSharePoint(),
    date,
  };
}

function state() {
  if (!globalState.__hshBoard) {
    globalState.__hshBoard = createState();
  }
  return globalState.__hshBoard;
}

function uniqueBookings(items: Booking[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export async function getBoard(viewDate?: string | null): Promise<BoardPayload> {
  const current = state();
  const date = isIsoDate(viewDate) ? viewDate : current.date;
  const potRooms = current.rooms.filter((room) => room.floor !== "SGB");
  const potBookings = current.bookings.filter(
    (item) =>
      dateOfInstant(item.start) === date &&
      potRooms.some((room) => room.id === item.roomId),
  );

  let sgbRooms: Room[] = current.rooms.filter((room) => room.floor === "SGB");
  let sgbBookings = current.bookings.filter(
    (item) =>
      dateOfInstant(item.start) === date &&
      sgbRooms.some((room) => room.id === item.roomId),
  );
  let source: BoardPayload["source"] = "mock";

  if (isGraphConfigured()) {
    try {
      const liveRooms = await fetchSgbOutlookRooms();
      if (liveRooms.length > 0) {
        sgbRooms = liveRooms;
        sgbBookings = await fetchSgbOutlookBookings(liveRooms, date);
        source = "graph";
        current.rooms = [...potRooms, ...liveRooms];
      }
    } catch (error) {
      console.error("Outlook SGB rooms failed", error);
    }
  }

  const kioskBookings = current.bookings.filter(
    (item) => item.source === "kiosk" && dateOfInstant(item.start) === date,
  );

  return {
    date,
    timezone: TIMEZONE,
    source,
    rooms: [...potRooms, ...sgbRooms],
    bookings: uniqueBookings([...potBookings, ...sgbBookings, ...kioskBookings]),
    hub: current.hub,
    sharepoint: current.sharepoint,
    kioskFloorId: resolveKioskFloor(process.env.HSH_KIOSK_FLOOR),
    dayStartHour: DAY_START_HOUR,
    dayEndHour: DAY_END_HOUR,
    inUseRoomIds: seedInUseRoomIds().filter((id) =>
      source === "graph" ? !id.startsWith("sgb") : true,
    ),
  };
}

export function createBooking(input: CreateBookingInput): Booking {
  const current = state();
  const room =
    current.rooms.find((item) => item.id === input.roomId) ??
    cachedSgbRooms().find((item) => item.id === input.roomId);
  if (!room) {
    throw new Error("That room is not on the Outlook room list.");
  }
  if (new Date(input.end) <= new Date(input.start)) {
    throw new Error("End time must be after the start time.");
  }
  const clash = current.bookings.find(
    (item) =>
      item.roomId === input.roomId &&
      rangesOverlap(item.start, item.end, input.start, input.end),
  );
  if (clash) {
    throw new Error(
      `${room.name} is already booked for ${clash.title} at that time.`,
    );
  }

  const booking: Booking = {
    id: `kiosk-${Date.now()}`,
    roomId: input.roomId,
    title: input.title.trim(),
    organizer: input.organizer.trim(),
    start: input.start,
    end: input.end,
    source: "kiosk",
  };

  current.bookings = [...current.bookings, booking].sort((a, b) =>
    a.start.localeCompare(b.start),
  );
  return booking;
}

export async function resetBoard() {
  clearGraphCache();
  globalState.__hshBoard = createState();
  return getBoard();
}
