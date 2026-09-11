/**
 * Floor-plan registry for CAD kiosk plates. Room ids must stay aligned
 * with Outlook / seed room ids.
 */
import { POT4F_ROOMS, POT4F_VIEWBOX } from "@/lib/pot4f-geometry";
import { POT5F_ROOMS, POT5F_VIEWBOX } from "@/lib/pot5f-geometry";
import { POT12F_ROOMS, POT12F_VIEWBOX } from "@/lib/pot12f-geometry";
import { POT14F_ROOMS, POT14F_VIEWBOX } from "@/lib/pot14f-geometry";
import { SGB8F_ROOMS, SGB8F_VIEWBOX } from "@/lib/sgb8f-geometry";
import type { Room } from "@/lib/types";

export const FLOOR_IDS = ["POT4F", "POT5F", "POT12F", "POT14F", "SGB8F"] as const;
export type FloorId = (typeof FLOOR_IDS)[number];

export type FloorPlanViewBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type FloorPlanRoomShape = {
  roomId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  labelX: number;
  labelY: number;
  path?: string;
};

export type OfficeFloor = {
  id: FloorId;
  building: string;
  code: string;
  shortLabel: string;
  asset: string;
  elevation?: string;
  viewBox: FloorPlanViewBox;
  rooms: FloorPlanRoomShape[];
};

export const DEFAULT_KIOSK_FLOOR: FloorId = "POT14F";

export const FLOOR_GROUPS = [
  {
    building: "Peninsula Office Tower",
    floorIds: ["POT4F", "POT5F", "POT12F", "POT14F"] as const,
  },
  {
    building: "St. George's Building",
    floorIds: ["SGB8F"] as const,
  },
] as const;

export function sgbBand(name: string): "7F" | "8F" | "other" {
  if (/HSH\s*7\s*\/?\s*F/i.test(name)) return "7F";
  if (/HSH\s*8\s*\/?\s*F/i.test(name)) return "8F";
  return "other";
}

export function isOutlookEquipmentResource(value: string) {
  return /video\s*conference\s*equipment|\bequipment\b/i.test(value);
}

export function isHshSgbRoomName(name: string, floorHint = "") {
  const haystack = `${name} ${floorHint}`;
  if (isOutlookEquipmentResource(haystack)) return false;
  return /HSH\s*[78]\s*\/?\s*F/i.test(haystack);
}

export function isSgbFloor(value: string | null | undefined) {
  return value === "SGB" || value === "SGB8F" || value === "SGB7F";
}

export function isFloorId(value: string | null | undefined): value is FloorId {
  return FLOOR_IDS.includes(value as FloorId);
}

export function resolveKioskFloor(value?: string | null): FloorId {
  if (value === "SGB" || value === "SGB8F" || value === "SGB7F") return "SGB8F";
  return isFloorId(value) ? value : DEFAULT_KIOSK_FLOOR;
}

type CadRoom = {
  roomId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  labelX?: number;
  labelY?: number;
  path?: string;
};

function cadShapes(rooms: readonly CadRoom[]): FloorPlanRoomShape[] {
  return rooms.map((room) => ({
    roomId: room.roomId,
    x: room.x,
    y: room.y,
    width: room.width,
    height: room.height,
    labelX: room.x + room.width / 2,
    labelY: room.y + room.height / 2,
    path: room.path,
  }));
}

export const OFFICE_FLOORS: OfficeFloor[] = [
  {
    id: "POT4F",
    building: "Peninsula Office Tower",
    code: "POT",
    shortLabel: "4F",
    asset: "/floorplans/pot4f.webp",
    elevation: "/buildings/pot-4f.jpg",
    viewBox: POT4F_VIEWBOX,
    rooms: cadShapes(POT4F_ROOMS),
  },
  {
    id: "POT5F",
    building: "Peninsula Office Tower",
    code: "POT",
    shortLabel: "5F",
    asset: "/floorplans/pot5f.webp",
    elevation: "/buildings/pot-5f.jpg",
    viewBox: POT5F_VIEWBOX,
    rooms: cadShapes(POT5F_ROOMS),
  },
  {
    id: "POT12F",
    building: "Peninsula Office Tower",
    code: "POT",
    shortLabel: "12F",
    asset: "/floorplans/pot12f.webp",
    elevation: "/buildings/pot-14f.jpg",
    viewBox: POT12F_VIEWBOX,
    rooms: cadShapes(POT12F_ROOMS),
  },
  {
    id: "POT14F",
    building: "Peninsula Office Tower",
    code: "POT",
    shortLabel: "14F",
    asset: "/floorplans/pot14f.webp",
    elevation: "/buildings/pot-15f.jpg",
    viewBox: POT14F_VIEWBOX,
    rooms: cadShapes(POT14F_ROOMS),
  },
  {
    id: "SGB8F",
    building: "St. George's Building",
    code: "SGB",
    shortLabel: "8F",
    asset: "/floorplans/sgb8f.webp",
    elevation: "/buildings/sgb-8f.jpg",
    viewBox: SGB8F_VIEWBOX,
    rooms: cadShapes(SGB8F_ROOMS),
  },
];

export function floorTitle(floor: Pick<OfficeFloor, "code" | "shortLabel">) {
  return `${floor.code} ${floor.shortLabel}`;
}

const SGB_CAD_MATCHERS: { roomId: string; test: (name: string) => boolean }[] = [
  { roomId: "sgb8-boardroom", test: (name) => /boardroom/i.test(name) },
  { roomId: "sgb8-meeting-10", test: (name) => /10\s*pax/i.test(name) },
  { roomId: "sgb8-meeting-6", test: (name) => /6\s*pax/i.test(name) },
  {
    roomId: "sgb8-phonebooth",
    test: (name) => /phone\s*booth/i.test(name) && !/west/i.test(name),
  },
  { roomId: "sgb8-west-booth", test: (name) => /west\s*booth|phone\s*booth/i.test(name) },
  { roomId: "sgb8-phone-n", test: (name) => /1\s*pax|phone/i.test(name) },
];

export function sgbRoomsFrom(rooms: Room[]) {
  return rooms.filter((room) => isSgbFloor(room.floor));
}

export function shapesForFloor(floor: OfficeFloor, rooms: Room[]) {
  if (floor.id !== "SGB8F") return floor.rooms;
  const live = sgbRoomsFrom(rooms).filter(
    (room) =>
      !room.id.startsWith("sgb8-") && isHshSgbRoomName(room.name, room.email),
  );
  if (live.length === 0) return floor.rooms;
  const used = new Set<string>();
  return floor.rooms.map((shape) => {
    const matcher = SGB_CAD_MATCHERS.find((item) => item.roomId === shape.roomId);
    const match = live.find(
      (room) => !used.has(room.id) && matcher?.test(`${room.name} ${room.email}`),
    );
    if (!match) return shape;
    used.add(match.id);
    return { ...shape, roomId: match.id };
  });
}

export function isKioskHiddenRoom(room: { id?: string; name?: string }) {
  return /phone|booth|huddle/i.test(`${room.id ?? ""} ${room.name ?? ""}`);
}

export function roomsOnFloor(floor: OfficeFloor, rooms: Room[]) {
  return shapesForFloor(floor, rooms)
    .map((shape) => rooms.find((room) => room.id === shape.roomId))
    .filter((room): room is Room => Boolean(room))
    .filter((room) => !isKioskHiddenRoom(room));
}
