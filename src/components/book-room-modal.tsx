"use client";

import { useMemo, useState } from "react";
import { AppModal } from "@/components/app-modal";
import { NativeInput, NativeSelect } from "@/components/native-select";
import { buttonVariants } from "@/components/ui/button";
import { useBoard } from "@/components/board-provider";
import { addMinutes, formatClock } from "@/lib/time";
import type { Room } from "@/lib/types";
import { cn } from "@/lib/utils";

export type SlotDraft = {
  room: Room;
  start: string;
};

const DURATIONS = [30, 60, 90, 120];

export function BookRoomModal({
  draft,
  onClose,
}: {
  draft: SlotDraft | null;
  onClose: () => void;
}) {
  const { book } = useBoard();
  const [title, setTitle] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [minutes, setMinutes] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const end = useMemo(() => {
    if (!draft) return "";
    return addMinutes(draft.start, minutes);
  }, [draft, minutes]);

  async function submit() {
    if (!draft) return;
    if (title.trim().length < 3) {
      setError("Give the meeting a short title.");
      return;
    }
    if (organizer.trim().length < 2) {
      setError("Who is booking this room?");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await book({
        roomId: draft.room.id,
        title,
        organizer,
        start: draft.start,
        end,
      });
      setTitle("");
      setOrganizer("");
      setMinutes(30);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Booking failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppModal
      open={draft !== null}
      onClose={onClose}
      title={draft ? `Book ${draft.room.name}` : "Book a room"}
      description={
        draft
          ? `${formatClock(draft.start)}–${formatClock(end)} · ${draft.room.floor} · holds ${draft.room.capacity}`
          : undefined
      }
    >
      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {error}
        </p>
      ) : null}
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <label className="grid gap-1.5 text-sm font-medium">
          Meeting title
          <NativeInput
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Project gate review"
            autoFocus
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Booked by
          <NativeInput
            value={organizer}
            onChange={(event) => setOrganizer(event.target.value)}
            placeholder="Name as it should appear on the board"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Duration
          <NativeSelect
            value={String(minutes)}
            onChange={(event) => setMinutes(Number(event.target.value))}
          >
            {DURATIONS.map((item) => (
              <option key={item} value={item}>
                {item} minutes
              </option>
            ))}
          </NativeSelect>
        </label>
        <div className="-mx-4 -mb-4 flex justify-end border-t bg-muted/50 p-4">
          <button
            type="submit"
            disabled={saving}
            className={cn(buttonVariants(), "min-w-28")}
          >
            {saving ? "Booking…" : "Book room"}
          </button>
        </div>
      </form>
    </AppModal>
  );
}
