import { NextResponse } from "next/server";
import { createBooking } from "@/lib/board-store";
import type { CreateBookingInput } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateBookingInput;
    if (!body.roomId || !body.title?.trim() || !body.organizer?.trim()) {
      return NextResponse.json(
        { error: "Room, title, and who is booking are required." },
        { status: 400 },
      );
    }
    if (!body.start || !body.end) {
      return NextResponse.json(
        { error: "Start and end times are required." },
        { status: 400 },
      );
    }
    const booking = createBooking({
      roomId: body.roomId,
      title: body.title,
      organizer: body.organizer,
      start: body.start,
      end: body.end,
    });
    return NextResponse.json(booking);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not create the booking.";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
