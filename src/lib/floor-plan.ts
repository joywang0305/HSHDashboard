/**
 * Geometry for the mock office plates. Replace this file (and the drawing in
 * `office-floor-plan.tsx`) when a real site plan is available — keep `roomId`
 * aligned with Outlook room ids.
 */
import type { Room } from "@/lib/types";

export const FLOOR_IDS = ["POT12F", "POT14F", "SGB"] as const;
export type FloorId = (typeof FLOOR_IDS)[number];

export type FloorPlanRoomShape = {
  roomId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  labelX: number;
  labelY: number;
};

export type OfficeFloor = {
  id: FloorId;
  building: string;
  layout: "pot12" | "pot14" | "sgb";
  rooms: FloorPlanRoomShape[];
};

export const FLOOR_PLAN_VIEWBOX = { width: 2000, height: 780 } as const;

export const DEFAULT_KIOSK_FLOOR: FloorId = "POT12F";

export function sgbBand(name: string): "7F" | "8F" | "other" {
  if (/HSH\s*7\s*\/?\s*F/i.test(name)) return "7F";
  if (/HSH\s*8\s*\/?\s*F/i.test(name)) return "8F";
  return "other";
}

export function isHshSgbRoomName(name: string, floorHint = "") {
  return /HSH\s*[78]\s*\/?\s*F/i.test(`${name} ${floorHint}`);
}

export function isFloorId(value: string | null | undefined): value is FloorId {
  return FLOOR_IDS.includes(value as FloorId);
}

export function resolveKioskFloor(value?: string | null): FloorId {
  if (value === "SGB8F") return "SGB";
  return isFloorId(value) ? value : DEFAULT_KIOSK_FLOOR;
}

function plateRoom(
  roomId: string,
  x: number,
  y: number,
  width: number,
  height: number,
): FloorPlanRoomShape {
  return {
    roomId,
    x,
    y,
    width,
    height,
    labelX: x + width / 2,
    labelY: y + height / 2,
  };
}

export const OFFICE_FLOORS: OfficeFloor[] = [
  {
    id: "POT12F",
    building: "Peninsula Office Tower",
    layout: "pot12",
    rooms: [
      plateRoom("boardroom-a", 56, 56, 280, 220),
      plateRoom("pot12-interview", 352, 56, 196, 220),
      plateRoom("quiet-room", 1748, 56, 196, 120),
      plateRoom("collaboration-2", 1748, 192, 196, 164),
      plateRoom("pot12-huddle", 56, 444, 240, 280),
      plateRoom("pot12-training", 312, 444, 280, 280),
    ],
  },
  {
    id: "POT14F",
    building: "Peninsula Office Tower",
    layout: "pot14",
    rooms: [
      plateRoom("pot14-boardroom", 1664, 56, 280, 220),
      plateRoom("pot14-interview", 1452, 56, 196, 220),
      plateRoom("pot14-focus", 56, 56, 196, 120),
      plateRoom("pot14-collab", 56, 192, 196, 164),
      plateRoom("pot14-huddle", 1704, 444, 240, 280),
      plateRoom("pot14-training", 1408, 444, 280, 280),
    ],
  },
  {
    id: "SGB",
    building: "St George's Building",
    layout: "sgb",
    rooms: [
      plateRoom("sgb-boardroom", 56, 56, 280, 200),
      plateRoom("sgb-huddle", 352, 56, 196, 200),
      plateRoom("sgb-focus", 1748, 56, 196, 200),
      plateRoom("sgb-collab", 56, 444, 240, 280),
      plateRoom("sgb-training", 312, 444, 280, 280),
      plateRoom("hub-studio", 1400, 444, 544, 280),
    ],
  },
];

function tileBand(
  rooms: Room[],
  x: number,
  y: number,
  width: number,
  height: number,
): FloorPlanRoomShape[] {
  if (rooms.length === 0) return [];
  const cols =
    rooms.length <= 4
      ? rooms.length
      : Math.min(rooms.length, Math.max(4, Math.ceil(rooms.length / 2)));
  const rows = Math.ceil(rooms.length / cols);
  const gap = 16;
  const cellWidth = (width - gap * (cols - 1)) / cols;
  const cellHeight = (height - gap * (rows - 1)) / rows;
  return rooms.map((room, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const left = x + col * (cellWidth + gap);
    const top = y + row * (cellHeight + gap);
    return plateRoom(room.id, left, top, cellWidth, cellHeight);
  });
}

export function layoutSgbRooms(rooms: Room[]): FloorPlanRoomShape[] {
  const seven = rooms
    .filter((room) => sgbBand(room.name) === "7F")
    .sort((a, b) => a.name.localeCompare(b.name));
  const eight = rooms
    .filter((room) => sgbBand(room.name) !== "7F")
    .sort((a, b) => a.name.localeCompare(b.name));
  if (seven.length && eight.length) {
    return [
      ...tileBand(eight, 56, 56, 1888, 332),
      ...tileBand(seven, 56, 404, 1888, 320),
    ];
  }
  const only = seven.length ? seven : eight;
  return [
    ...tileBand(only.slice(0, Math.ceil(only.length / 2)), 56, 56, 1888, 332),
    ...tileBand(only.slice(Math.ceil(only.length / 2)), 56, 404, 1888, 320),
  ];
}

export function sgbRoomsFrom(rooms: Room[]) {
  return rooms.filter((room) => room.floor === "SGB");
}

export function shapesForFloor(floor: OfficeFloor, rooms: Room[]) {
  if (floor.id !== "SGB") return floor.rooms;
  const live = sgbRoomsFrom(rooms);
  return live.length ? layoutSgbRooms(live) : floor.rooms;
}

export function roomsOnFloor(floor: OfficeFloor, rooms: Room[]) {
  const shapes = shapesForFloor(floor, rooms);
  return shapes
    .map((shape) => rooms.find((room) => room.id === shape.roomId))
    .filter((room): room is Room => Boolean(room));
}
