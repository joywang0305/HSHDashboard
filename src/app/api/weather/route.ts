import { NextResponse } from "next/server";
import { fetchHkWeather } from "@/lib/hk-weather";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const weather = await fetchHkWeather();
    return NextResponse.json(weather, {
      headers: { "Cache-Control": "public, max-age=300" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load Hong Kong weather.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
