import { NextResponse } from "next/server";
import { getBoard } from "@/lib/board-store";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("date");
  return NextResponse.json(getBoard(date));
}
