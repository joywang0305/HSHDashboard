"use client";

import type { ReactNode } from "react";
import { AppModal } from "@/components/app-modal";
import { formatClock } from "@/lib/time";
import type { Booking, Room } from "@/lib/types";

function showAsLabel(value?: string) {
  if (!value) return null;
  const labels: Record<string, string> = {
    busy: "Busy",
    tentative: "Tentative",
    free: "Free",
    oof: "Out of office",
    workingelsewhere: "Working elsewhere",
  };
  return labels[value.toLowerCase()] ?? value;
}

function attendeeStatus(value?: string) {
  if (!value || value === "none" || value === "notResponded") return null;
  if (value === "accepted") return "Accepted";
  if (value === "tentativelyAccepted") return "Tentative";
  if (value === "declined") return "Declined";
  if (value === "organizer") return "Organiser";
  return value;
}

export function BookingDetailModal({
  booking,
  room,
  onClose,
}: {
  booking: Booking | null;
  room?: Room;
  onClose: () => void;
}) {
  const attendees = booking?.attendees?.filter((item) => item.name) ?? [];
  const showAs = showAsLabel(booking?.showAs);

  return (
    <AppModal
      open={booking !== null}
      onClose={onClose}
      eyebrow="Booking"
      title={booking?.title ?? "Meeting"}
      description={
        booking
          ? `${formatClock(booking.start)}–${formatClock(booking.end)}${
              room ? ` · ${room.name} · ${room.floor}` : ""
            }`
          : undefined
      }
    >
      {booking ? (
        <div className="grid max-h-[60vh] gap-4 overflow-y-auto">
          <DetailRow label="Organised by">
            {booking.organizer}
            {booking.organizerEmail ? (
              <span className="mt-0.5 block font-normal tracking-normal text-[#6b6458] normal-case">
                {booking.organizerEmail}
              </span>
            ) : null}
          </DetailRow>
          {showAs ? <DetailRow label="Show as">{showAs}</DetailRow> : null}
          {booking.location ? (
            <DetailRow label="Location">{booking.location}</DetailRow>
          ) : null}
          {booking.isOnlineMeeting || booking.teamsUrl ? (
            <DetailRow label="Online">
              {booking.teamsUrl ? (
                <a
                  href={booking.teamsUrl}
                  className="break-all font-normal tracking-normal text-[#004b49] underline-offset-2 hover:underline"
                >
                  Join Teams meeting
                </a>
              ) : (
                "Teams meeting"
              )}
            </DetailRow>
          ) : null}
          {attendees.length > 0 ? (
            <DetailRow label="Attendees">
              <ul className="grid gap-1 font-normal tracking-normal normal-case">
                {attendees.map((person, index) => {
                  const status = attendeeStatus(person.status);
                  return (
                    <li key={`${person.email ?? person.name}-${index}`}>
                      {person.name}
                      {status ? (
                        <span className="text-[#6b6458]"> · {status}</span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </DetailRow>
          ) : null}
          {booking.notes ? (
            <DetailRow label="Notes">
              <p className="whitespace-pre-wrap font-normal tracking-normal normal-case text-[#1c1914]">
                {booking.notes}
              </p>
            </DetailRow>
          ) : null}
          {booking.isPrivate ? (
            <p className="text-sm text-[#6b6458]">
              This hold is marked private in Outlook. Some fields may be hidden.
            </p>
          ) : null}
          <p className="text-[10px] tracking-[0.16em] text-[#6b6458] uppercase">
            {booking.source === "kiosk" ? "Booked at this kiosk" : "From Outlook"}
          </p>
        </div>
      ) : null}
    </AppModal>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1">
      <p className="text-[11px] font-medium tracking-[0.18em] text-[#004b49] uppercase">
        {label}
      </p>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}
