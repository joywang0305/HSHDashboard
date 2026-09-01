import { seedBookings, seedHub, seedRooms, seedSharePoint } from "@/lib/seed";
import { dateOfInstant, isIsoDate, rangesOverlap, todayInZone } from "@/lib/time";
import type {
  BoardPayload,
  Booking,
  CreateBookingInput,
} from "@/lib/types";
import { DAY_END_HOUR, DAY_START_HOUR, TIMEZONE } from "@/lib/time";

export function isGraphConfigured() {
  return Boolean(
    process.env.MICROSOFT_GRAPH_CLIENT_ID &&
      process.env.MICROSOFT_GRAPH_CLIENT_SECRET &&
      process.env.MICROSOFT_GRAPH_TENANT_ID,
  );
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

export function getBoard(viewDate?: string | null): BoardPayload {
  const current = state();
  const date = isIsoDate(viewDate) ? viewDate : current.date;
  const bookings = current.bookings.filter(
    (item) => dateOfInstant(item.start) === date,
  );
  return {
    date,
    timezone: TIMEZONE,
    source: isGraphConfigured() ? "graph" : "mock",
    rooms: current.rooms,
    bookings,
    hub: current.hub,
    sharepoint: current.sharepoint,
    dayStartHour: DAY_START_HOUR,
    dayEndHour: DAY_END_HOUR,
  };
}

export function createBooking(input: CreateBookingInput): Booking {
  const current = state();
  const room = current.rooms.find((item) => item.id === input.roomId);
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

  // When Graph credentials exist this is where we POST
  // /users/{room.email}/events and then refresh calendarView.
  current.bookings = [...current.bookings, booking].sort((a, b) =>
    a.start.localeCompare(b.start),
  );
  return booking;
}

export function resetBoard() {
  globalState.__hshBoard = createState();
  return getBoard();
}
