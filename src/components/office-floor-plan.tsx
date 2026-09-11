"use client";

import { useState, type KeyboardEvent, type MouseEvent } from "react";
import { useBoard } from "@/components/board-provider";
import {
  FLOOR_GROUPS,
  OFFICE_FLOORS,
  isKioskHiddenRoom,
  resolveKioskFloor,
  shapesForFloor,
  type FloorId,
  type FloorPlanRoomShape,
  type OfficeFloor,
} from "@/lib/floor-plan";
import {
  occupancyPaint,
  occupancyWord,
  OCCUPANCY_STROKE,
  roomOccupancy,
} from "@/lib/room-occupancy";
import { todayInZone } from "@/lib/time";
import type { Booking, Room } from "@/lib/types";
import { cn } from "@/lib/utils";

type OfficeFloorPlanProps = {
  kioskFloorId: FloorId;
  viewingFloorId?: FloorId;
  selectedRoomId: string | null;
  onSelectFloor: (floorId: FloorId) => void;
  onSelectRoom: (roomId: string | null) => void;
  embedded?: boolean;
};

export function OfficeFloorPlan({
  kioskFloorId,
  viewingFloorId,
  selectedRoomId,
  onSelectFloor,
  onSelectRoom,
  embedded = false,
}: OfficeFloorPlanProps) {
  const { board, loading, error, now } = useBoard();
  const viewingToday = board?.date === todayInZone(board?.timezone, now);
  const [internalFloorId, setInternalFloorId] = useState<FloorId>(kioskFloorId);
  const activeFloorId = viewingFloorId ?? internalFloorId;

  if (loading && !board) {
    return (
      <div className="h-full min-h-64 animate-pulse bg-[#efe8da]" aria-busy="true" />
    );
  }

  if ((error && !board) || !board) {
    return (
      <p className="border border-[#d9cdb8] bg-white px-4 py-6 text-sm text-[#6b6458]">
        Floor plan unavailable until the board feed loads.
      </p>
    );
  }

  const roomsById = new Map(board.rooms.map((room) => [room.id, room]));
  const floor =
    OFFICE_FLOORS.find((item) => item.id === activeFloorId) ??
    OFFICE_FLOORS.find((item) => item.id === resolveKioskFloor(kioskFloorId)) ??
    OFFICE_FLOORS[0];

  return (
    <section
      aria-label={`${floor.id} floor plan with meeting rooms coloured by occupancy`}
      className={cn(
        "flex h-full min-h-0 flex-col border border-[#d9cdb8] bg-white",
        !embedded && "min-h-[22rem]",
      )}
    >
      {embedded ? null : (
        <div className="flex shrink-0 items-end justify-between gap-4 border-b border-[#d9cdb8] bg-white px-4 py-2">
          <div className="flex min-w-0 flex-wrap items-end gap-x-6 gap-y-2">
            {FLOOR_GROUPS.map((group) => (
              <div key={group.building} className="flex min-w-0 flex-col gap-1.5">
                <p className="text-[10px] tracking-[0.18em] text-[#c5a44e] uppercase">
                  {group.building}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {group.floorIds.map((floorId) => {
                    const item = OFFICE_FLOORS.find((entry) => entry.id === floorId);
                    if (!item) return null;
                    const selected = activeFloorId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setInternalFloorId(item.id);
                          onSelectFloor(item.id);
                        }}
                        aria-pressed={selected}
                        className={cn(
                          "min-w-12 border px-3 py-1.5 text-sm leading-none outline-none",
                          selected
                            ? "border-[#c5a44e] bg-[#004b49] text-[#f7f3eb] ring-1 ring-[#c5a44e]"
                            : "border-[#d9cdb8] bg-[#f7f3eb] text-[#004b49] hover:border-[#c5a44e]",
                        )}
                        style={{ fontFamily: "var(--font-cormorant), serif" }}
                      >
                        {item.shortLabel}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <p className="shrink-0 pb-1 text-right text-[10px] tracking-[0.12em] text-[#6b6458] uppercase">
            Tap a room to open the calendar
          </p>
        </div>
      )}

      <div className="flex min-h-0 flex-1 items-center justify-center bg-[#fffcf7] p-2">
        {OFFICE_FLOORS.map((item) => (
          <link key={item.asset} rel="preload" as="image" href={item.asset} />
        ))}
        <FloorPlateSvg
          floor={{ ...floor, rooms: shapesForFloor(floor, board.rooms) }}
          roomsById={roomsById}
          bookings={board.bookings}
          inUseRoomIds={board.inUseRoomIds}
          now={now}
          viewingToday={viewingToday}
          selectedRoomId={selectedRoomId}
          onSelectFloor={onSelectFloor}
          onSelectRoom={onSelectRoom}
        />
      </div>

      {embedded ? null : (
        <div className="flex shrink-0 flex-wrap items-center gap-4 border-t border-[#d9cdb8] bg-white px-4 py-2 text-[10px] tracking-[0.16em] text-[#6b6458] uppercase">
          <span className="inline-flex items-center gap-2">
            <span className="size-3 bg-[#004b49]/30 ring-1 ring-[#004b49]" />
            Available
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="floor-legend-pulse size-3 bg-[#004b49] ring-1 ring-[#004b49]" />
            In use
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="size-3 bg-[#9b2c2c]/50 ring-1 ring-[#9b2c2c]" />
            Booked
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="floor-legend-pulse size-3 bg-[#9b2c2c] ring-1 ring-[#9b2c2c]" />
            Occupied
          </span>
        </div>
      )}
    </section>
  );
}

function FloorPlateSvg({
  floor,
  roomsById,
  bookings,
  inUseRoomIds,
  now,
  viewingToday,
  selectedRoomId,
  onSelectFloor,
  onSelectRoom,
}: {
  floor: OfficeFloor;
  roomsById: Map<string, Room>;
  bookings: Booking[];
  inUseRoomIds: string[];
  now: Date;
  viewingToday: boolean;
  selectedRoomId: string | null;
  onSelectFloor: (floorId: FloorId) => void;
  onSelectRoom: (roomId: string | null) => void;
}) {
  const { x, y, width, height } = floor.viewBox;
  return (
    <svg
      viewBox={`${x} ${y} ${width} ${height}`}
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="hsh-occ-free" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#004b49" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#004b49" stopOpacity="0.26" />
        </linearGradient>
        <linearGradient id="hsh-occ-inuse" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a5c59" />
          <stop offset="100%" stopColor="#003835" />
        </linearGradient>
        <linearGradient id="hsh-occ-booked" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9b2c2c" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#9b2c2c" stopOpacity="0.56" />
        </linearGradient>
        <linearGradient id="hsh-occ-busy" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b04545" />
          <stop offset="100%" stopColor="#7a2222" />
        </linearGradient>
      </defs>
      <rect x={x} y={y} width={width} height={height} fill="#fffcf7" />
      <image
        href={floor.asset}
        x={x}
        y={y}
        width={width}
        height={height}
        preserveAspectRatio="none"
      />
      {floor.rooms.map((shape) => {
        const room = roomsById.get(shape.roomId);
        if (isKioskHiddenRoom({ id: shape.roomId, name: room?.name })) return null;
        return (
          <FloorRoom
            key={shape.roomId}
            shape={shape}
            room={room}
            bookings={bookings}
            inUseRoomIds={inUseRoomIds}
            now={now}
            viewingToday={viewingToday}
            selectedRoomId={selectedRoomId}
            onSelectFloor={() => onSelectFloor(floor.id)}
            onSelectRoom={onSelectRoom}
            largeLabel
          />
        );
      })}
    </svg>
  );
}

const SERIF_EM = 0.68;
const SANS_EM = 0.62;

function fitFontSize(
  text: string,
  maxWidth: number,
  maxSize: number,
  minSize: number,
  em = SERIF_EM,
) {
  if (maxWidth <= 0 || text.length === 0) return minSize;
  return Math.max(minSize, Math.min(maxSize, maxWidth / (text.length * em)));
}

function nameLayout(name: string, width: number, height: number) {
  const pad = Math.min(8, Math.max(3, width * 0.14));
  const maxWidth = Math.max(8, width - pad * 2);
  const parts = name.trim().split(/\s+/);
  const last = parts[parts.length - 1] ?? "";
  const maxSize =
    height < 26 ? 6.5 : height < 36 ? 7.5 : height < 56 ? 9 : height < 90 ? 10 : 12.5;
  const minSize = height < 26 ? 5 : 5.5;
  // Keep "Phone A" / "Phone B" on one row. Only wrap tall meeting rooms.
  const wrap = parts.length > 1 && last.length > 2 && height >= 90;
  if (wrap) {
    const lines =
      parts.length === 2 ? parts : [parts[0], parts.slice(1).join(" ")];
    const longest = lines.reduce((a, b) => (a.length >= b.length ? a : b));
    return {
      lines,
      fontSize: fitFontSize(longest, maxWidth, maxSize, minSize),
    };
  }
  return {
    lines: [name],
    fontSize: fitFontSize(name, maxWidth, maxSize, minSize),
  };
}

function FloorRoom({
  shape,
  room,
  bookings,
  inUseRoomIds,
  now,
  viewingToday,
  selectedRoomId,
  onSelectFloor,
  onSelectRoom,
  largeLabel = false,
}: {
  shape: FloorPlanRoomShape;
  room?: Room;
  bookings: Booking[];
  inUseRoomIds: string[];
  now: Date;
  viewingToday: boolean;
  selectedRoomId: string | null;
  onSelectFloor: () => void;
  onSelectRoom: (roomId: string | null) => void;
  largeLabel?: boolean;
}) {
  if (!room) return null;
  const occupancy = roomOccupancy(
    room.id,
    bookings,
    now,
    viewingToday,
    inUseRoomIds,
  );
  const selected = selectedRoomId === room.id;
  const paint = occupancyPaint(occupancy);
  const stroke = selected ? "#c5a44e" : "none";
  const { lines, fontSize } = nameLayout(room.name, shape.width, shape.height);
  const occupancyLabel = occupancyWord(occupancy.kind);
  const showMeta = shape.height >= 56 && shape.width >= 52;
  const metaSize = showMeta
    ? fitFontSize(occupancyLabel, shape.width - 16, 8, 5.5, SANS_EM)
    : 0;
  const nameGap = fontSize * 1.08;
  const stack = lines.length * nameGap + (showMeta ? metaSize + 4 : 0);
  const labelX = shape.x + shape.width / 2;
  const labelY = shape.y + shape.height / 2;
  const nameTop = labelY - stack / 2 + fontSize * 0.82;
  const metaY = nameTop + lines.length * nameGap + 2;

  const occupancyShape = {
    fill: paint.svgFill,
    stroke,
    strokeWidth: selected ? 2 : 0,
    className: cn(occupancy.occupied && "floor-room-busy"),
    role: "button" as const,
    tabIndex: 0,
    "aria-pressed": selected,
    "aria-label": `${room.name}, ${occupancyWord(occupancy.kind).toLowerCase()}. ${occupancy.label}`,
    style: { cursor: "pointer" as const },
    onClick: (event: MouseEvent<SVGElement>) => {
      event.stopPropagation();
      onSelectFloor();
      onSelectRoom(selected ? null : room.id);
    },
    onKeyDown: (event: KeyboardEvent<SVGElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
        onSelectFloor();
        onSelectRoom(selected ? null : room.id);
      }
    },
  };

  return (
    <g>
      {shape.path ? (
        <path d={shape.path} {...occupancyShape} />
      ) : (
        <rect
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          {...occupancyShape}
          strokeWidth={selected ? 3 : largeLabel ? 1.25 : 2.25}
          stroke={selected ? "#c5a44e" : OCCUPANCY_STROKE[occupancy.kind]}
        />
      )}
      {lines.map((line, index) => (
          <text
            key={`${line}-${index}`}
            x={labelX}
            y={nameTop + index * nameGap}
            textAnchor="middle"
            fill="#1c1914"
            fontSize={fontSize}
            fontWeight={largeLabel ? 600 : undefined}
            style={{
              fontFamily: "var(--font-cormorant), serif",
              pointerEvents: "none",
            }}
          >
            {line}
          </text>
      ))}
      {showMeta ? (
          <text
            x={labelX}
            y={metaY}
            textAnchor="middle"
            fill={occupancy.kind === "booked" ? "#9b2c2c" : "#004b49"}
            fontSize={metaSize}
            letterSpacing="0.08em"
            style={{
              fontFamily: "var(--font-outfit), sans-serif",
              pointerEvents: "none",
            }}
          >
            {occupancyLabel}
          </text>
      ) : null}
    </g>
  );
}

