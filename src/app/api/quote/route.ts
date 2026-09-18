import { NextResponse } from "next/server";
import { fetchHshQuote } from "@/lib/hsh-quote";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const quote = await fetchHshQuote();
    return NextResponse.json(quote, {
      headers: { "Cache-Control": "public, max-age=60" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load HSH share price.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
