"use client";

import { useMemo, useState } from "react";
import { BookRoomModal, type SlotDraft } from "@/components/book-room-modal";
import { useBoard } from "@/components/board-provider";
import {
  DAY_END_HOUR,
  DAY_START_HOUR,
  SLOT_MINUTES,
  addMinutes,
  formatClock,
  isoFromDateAndMinutes,
  minutesFromMidnight,
  rangesOverlap,
  todayInZone,
} from "@/lib/time";
import { bookingPhase, roomOccupancy } from "@/lib/room-occupancy";
import type { Booking, Room } from "@/lib/types";
import { cn } from "@/lib/utils";

const HOURS = Array.from(
  { length: DAY_END_HOUR - DAY_START_HOUR },
  (_, index) => DAY_START_HOUR + index,
);
const TOTAL_MINUTES = (DAY_END_HOUR - DAY_START_HOUR) * 60;

export function RoomDayBoard({
  rooms,
  floorLabel,
  selectedRoomId = null,
  onSelectRoom,
}: {
  rooms?: Room[];
  floorLabel?: string;
  selectedRoomId?: string | null;
  onSelectRoom?: (roomId: string | null) => void;
}) {
  const { board, loading, error, now } = useBoard();
  const [draft, setDraft] = useState<SlotDraft | null>(null);
  const timeZone = board?.timezone;
  const viewingToday = board?.date === todayInZone(timeZone, now);

  const nowMinutes = minutesFromMidnight(now.toISOString(), timeZone);
  const nowTopPct =
    ((nowMinutes - DAY_START_HOUR * 60) / TOTAL_MINUTES) * 100;

  const hoursLabel = useMemo(
    () =>
      HOURS.map((hour) => ({
        hour,
        label: `${String(hour).padStart(2, "0")}:00`,
      })),
    [],
  );

  if (loading && !board) {
    return (
      <div className="space-y-3" aria-busy="true">
        <div className="h-24 animate-pulse bg-[#efe8da]" />
        <div className="h-80 animate-pulse bg-[#efe8da]" />
      </div>
    );
  }

  if (error && !board) {
    return (
      <p
        role="alert"
        className="border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-800"
      >
        {error}
      </p>
    );
  }

  if (!board) return null;

  const visibleRooms = rooms ?? board.rooms;
  const columnCount = Math.max(visibleRooms.length, 1);

  if (visibleRooms.length === 0) {
    return (
      <p className="border border-[#d9cdb8] bg-white px-4 py-6 text-sm text-[#6b6458]">
        No meeting rooms are listed for this floor.
      </p>
    );
  }

  function pickSlot(room: Room, clientY: number, column: HTMLElement) {
    const rect = column.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    const raw = DAY_START_HOUR * 60 + ratio * TOTAL_MINUTES;
    const snapped = Math.floor(raw / SLOT_MINUTES) * SLOT_MINUTES;
    const start = isoFromDateAndMinutes(board!.date, snapped);
    const probeEnd = addMinutes(start, SLOT_MINUTES);
    const clash = board!.bookings.some(
      (item) =>
        item.roomId === room.id &&
        rangesOverlap(item.start, item.end, start, probeEnd),
    );
    if (clash) return;
    setDraft({ room, start });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden border border-[#d9cdb8] bg-white">
        {floorLabel ? (
          <div className="flex shrink-0 items-baseline justify-between gap-3 border-b border-[#d9cdb8] px-3 py-1.5">
            <p
              className="text-base leading-tight text-[#004b49]"
              style={{ fontFamily: "var(--font-cormorant), serif" }}
            >
              {floorLabel}
            </p>
            <p className="text-[10px] tracking-[0.16em] text-[#6b6458] uppercase">
              Tap an empty slot to book
            </p>
          </div>
        ) : null}
        <div
          className="relative z-20 grid shrink-0 min-w-0 overflow-x-auto bg-white"
          style={{
            gridTemplateColumns: `3rem repeat(${columnCount}, minmax(5rem, 1fr))`,
          }}
        >
          <div className="flex items-end border-b border-[#d9cdb8] px-2 py-2 text-[10px] tracking-[0.2em] text-[#6b6458] uppercase">
            Time
          </div>
          {visibleRooms.map((room) => {
            const status = roomOccupancy(
              room.id,
              board.bookings,
              now,
              viewingToday,
              board.inUseRoomIds,
            );
            const selected = selectedRoomId === room.id;
            return (
              <button
                key={room.id}
                type="button"
                onClick={() =>
                  onSelectRoom?.(selected ? null : room.id)
                }
                className={cn(
                  "border-b border-l border-[#d9cdb8] px-1.5 py-1.5 text-left",
                  selected ? "bg-[#efe8da]" : "bg-white",
                  status.kind === "booked" && "shadow-[inset_0_3px_0_0_#9b2c2c]",
                  (status.kind === "in-use" || status.kind === "free") &&
                    "shadow-[inset_0_3px_0_0_#004b49]",
                )}
              >
                <p
                  className="truncate text-sm leading-tight text-[#004b49] md:text-base"
                  style={{ fontFamily: "var(--font-cormorant), serif" }}
                >
                  {room.name}
                </p>
                <p className="text-[10px] tracking-[0.12em] text-[#6b6458] uppercase">
                  {room.capacity} seats · {room.floor}
                </p>
                <p
                  className={cn(
                    "mt-1 text-[10px] font-medium tracking-[0.08em] uppercase",
                    status.kind === "booked" && "text-[#9b2c2c]",
                    (status.kind === "in-use" || status.kind === "free") &&
                      "text-[#004b49]",
                  )}
                >
                  {status.label}
                </p>
              </button>
            );
          })}
        </div>
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <div
            className="grid h-full min-w-0 overflow-x-auto"
            style={{
              gridTemplateColumns: `3rem repeat(${columnCount}, minmax(5rem, 1fr))`,
            }}
          >
            <div className="flex h-full min-h-0 flex-col">
              {hoursLabel.map((item) => (
                <div
                  key={item.hour}
                  className="flex min-h-0 flex-1 border-b border-[#efe8da] px-2 text-[11px] tracking-[0.08em] text-[#6b6458]"
                >
                  {item.label}
                </div>
              ))}
            </div>

            {visibleRooms.map((room) => {
              const roomBookings = board.bookings.filter(
                (item) => item.roomId === room.id,
              );
              const selected = selectedRoomId === room.id;
              return (
                <div
                  key={room.id}
                  className={cn(
                    "relative h-full min-h-0 cursor-pointer overflow-hidden border-l border-[#efe8da]",
                    selected && "bg-[#efe8da]/40",
                  )}
                  style={{
                    backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent calc(100% / ${HOURS.length} - 1px), #efe8da calc(100% / ${HOURS.length} - 1px), #efe8da calc(100% / ${HOURS.length}))`,
                  }}
                  onClick={(event) =>
                    pickSlot(room, event.clientY, event.currentTarget)
                  }
                >
                  {roomBookings.map((booking) => (
                    <BookingBlock
                      key={booking.id}
                      booking={booking}
                      now={now}
                      viewingToday={viewingToday}
                      viewDate={board.date}
                      timeZone={timeZone}
                    />
                  ))}
                </div>
              );
            })}
          </div>
          {viewingToday &&
          nowMinutes >= DAY_START_HOUR * 60 &&
          nowMinutes <= DAY_END_HOUR * 60 ? (
            <div
              className="pointer-events-none absolute right-0 left-0 z-10"
              style={{ top: `${nowTopPct}%` }}
            >
              <div className="flex items-center">
                <span className="bg-[#c5a44e] px-1.5 py-0.5 text-[9px] font-medium tracking-[0.16em] text-[#004b49] uppercase">
                  Now
                </span>
                <div className="h-px flex-1 bg-[#c5a44e]" />
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <BookRoomModal
        key={draft ? `${draft.room.id}-${draft.start}` : "closed"}
        draft={draft}
        onClose={() => setDraft(null)}
      />
    </div>
  );
}

function BookingBlock({
  booking,
  now,
  viewingToday,
  viewDate,
  timeZone,
}: {
  booking: Booking;
  now: Date;
  viewingToday: boolean;
  viewDate: string;
  timeZone?: string;
}) {
  const dayStart = DAY_START_HOUR * 60;
  const dayEnd = DAY_END_HOUR * 60;
  const start = Math.max(dayStart, minutesFromMidnight(booking.start, timeZone));
  const end = Math.min(dayEnd, minutesFromMidnight(booking.end, timeZone));
  if (end <= dayStart || start >= dayEnd) return null;

  const top = ((start - dayStart) / TOTAL_MINUTES) * 100;
  const height = Math.max(2.4, ((end - start) / TOTAL_MINUTES) * 100 - 0.35);
  const phase = bookingPhase(booking, now, viewingToday, viewDate);

  return (
    <button
      type="button"
      className={cn(
        "absolute right-1 left-1 z-20 overflow-hidden border-l-2 px-2 py-0.5 text-left shadow-sm",
        phase === "current" &&
          "border-[#9b2c2c] bg-[#9b2c2c] text-white",
        phase === "past" &&
          "border-[#c5a44e]/40 bg-[#004b49]/22 text-[#004b49]",
        phase === "upcoming" &&
          "border-[#c5a44e] bg-[#004b49] text-white",
      )}
      style={{ top: `${top}%`, height: `${height}%` }}
      onClick={(event) => event.stopPropagation()}
    >
      <p className="truncate text-xs font-medium">{booking.title}</p>
      <p
        className={cn(
          "truncate text-[10px]",
          phase === "current" && "text-[#f3d4d4]",
          phase === "past" && "text-[#6b6458]",
          phase === "upcoming" && "text-[#c5a44e]",
        )}
      >
        {formatClock(booking.start, timeZone)}–{formatClock(booking.end, timeZone)}{" "}
        ·{" "}
        {booking.organizer}
      </p>
    </button>
  );
}
