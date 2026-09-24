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

function hexToRgba(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export type OccupancyTone = "free" | "in-use" | "booked" | "busy";

export function occupancyTone(occupancy: RoomOccupancy): OccupancyTone {
  if (occupancy.occupied && occupancy.kind === "booked") return "busy";
  if (occupancy.occupied) return "in-use";
  if (occupancy.kind === "booked") return "booked";
  return "free";
}

/** Soft wash — keep Peninsula/gold identity without the dashboard’s vivid ramps. */
export const OCCUPANCY_CSS: Record<OccupancyTone, string> = {
  free: "linear-gradient(165deg, rgba(0,75,73,0.12) 0%, rgba(0,75,73,0.26) 100%)",
  "in-use": "linear-gradient(165deg, #0a5c59 0%, #004b49 58%, #003835 100%)",
  booked: "linear-gradient(165deg, rgba(155,44,44,0.38) 0%, rgba(155,44,44,0.56) 100%)",
  busy: "linear-gradient(165deg, #b04545 0%, #9b2c2c 55%, #7a2222 100%)",
};

export const OCCUPANCY_SVG_ID: Record<OccupancyTone, string> = {
  free: "hsh-occ-free",
  "in-use": "hsh-occ-inuse",
  booked: "hsh-occ-booked",
  busy: "hsh-occ-busy",
};

/** Shared swatch for room tiles and CAD overlays so both use the same paint. */
export function occupancyPaint(occupancy: RoomOccupancy) {
  const fill = OCCUPANCY_FILL[occupancy.kind];
  const fillOpacity = occupancyFillOpacity(occupancy);
  const tone = occupancyTone(occupancy);
  return {
    fill,
    fillOpacity,
    backgroundColor: hexToRgba(fill, fillOpacity ?? 1),
    backgroundImage: OCCUPANCY_CSS[tone],
    svgFill: `url(#${OCCUPANCY_SVG_ID[tone]})`,
    color: occupancy.occupied
      ? "#f7f3eb"
      : occupancy.kind === "booked"
        ? "#9b2c2c"
        : "#004b49",
  };
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
