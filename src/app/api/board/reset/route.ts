import { NextResponse } from "next/server";
import { resetBoard } from "@/lib/board-store";

export const dynamic = "force-dynamic";

export function POST() {
  return NextResponse.json(resetBoard());
}
