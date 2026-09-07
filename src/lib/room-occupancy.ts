import { formatClock, todayInZone } from "@/lib/time";
import type { Booking } from "@/lib/types";

export type OccupancyKind = "booked" | "in-use" | "free";

export type RoomOccupancy = {
  kind: OccupancyKind;
  label: string;
  /** Someone is physically in the room right now. */
  occupied: boolean;
};

export const OCCUPANCY_FILL: Record<OccupancyKind, string> = {
  booked: "#9b2c2c",
  "in-use": "#004b49",
  free: "#004b49",
};

export const OCCUPANCY_STROKE: Record<OccupancyKind, string> = {
  booked: "#9b2c2c",
  "in-use": "#004b49",
  free: "#004b49",
};

export function occupancyFillOpacity(occupancy: RoomOccupancy) {
  if (occupancy.occupied) return undefined;
  if (occupancy.kind === "booked") return 0.5;
  return 0.22;
}

export function occupancyWord(kind: OccupancyKind) {
  if (kind === "booked") return "OCCUPIED";
  if (kind === "in-use") return "IN USE";
  return "AVAILABLE";
}

export function roomOccupancy(
  roomId: string,
  bookings: Booking[],
  now: Date,
  viewingToday: boolean,
  inUseRoomIds: string[] = [],
): RoomOccupancy {
  const roomBookings = bookings.filter((item) => item.roomId === roomId);
  if (!viewingToday) {
    if (roomBookings.length === 0) {
      return { kind: "free", occupied: false, label: "No meetings booked" };
    }
    return {
      kind: "free",
      occupied: false,
      label: `${roomBookings.length} meeting${roomBookings.length === 1 ? "" : "s"}`,
    };
  }
  const occupied = inUseRoomIds.includes(roomId);
  const current = roomBookings.find(
    (item) => new Date(item.start) <= now && new Date(item.end) > now,
  );
  if (current) {
    return {
      kind: "booked",
      occupied,
      label: `Busy until ${formatClock(current.end)}`,
    };
  }
  const next = roomBookings
    .filter((item) => new Date(item.start) > now)
    .sort((a, b) => a.start.localeCompare(b.start))[0];
  if (occupied) {
    return {
      kind: "in-use",
      occupied: true,
      label: next
        ? `Someone inside · free until ${formatClock(next.start)}`
        : "Someone inside",
    };
  }
  if (next) {
    return {
      kind: "free",
      occupied: false,
      label: `Free until ${formatClock(next.start)}`,
    };
  }
  return {
    kind: "free",
    occupied: false,
    label: "Free for the rest of the day",
  };
}

export type BookingPhase = "past" | "current" | "upcoming";

export function bookingPhase(
  booking: Booking,
  now: Date,
  viewingToday: boolean,
  viewDate: string,
): BookingPhase {
  if (!viewingToday) {
    return viewDate < todayInZone() ? "past" : "upcoming";
  }
  const t = now.getTime();
  if (new Date(booking.end).getTime() <= t) return "past";
  if (new Date(booking.start).getTime() <= t) return "current";
  return "upcoming";
}
