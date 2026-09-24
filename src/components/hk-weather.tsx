"use client";

import { useEffect, useState } from "react";
import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  Sun,
  ThermometerSun,
  Snowflake,
  Wind,
} from "lucide-react";
import type { HkWeather, WeatherIconKind } from "@/lib/hk-weather";

const POLL_MS = 10 * 60_000;

const ICONS: Record<
  WeatherIconKind,
  typeof Sun
> = {
  sun: Sun,
  "sun-cloud": CloudSun,
  cloud: Cloud,
  rain: CloudRain,
  storm: CloudLightning,
  wind: Wind,
  fog: CloudFog,
  hot: ThermometerSun,
  cold: Snowflake,
};

export function HkWeather() {
  const [weather, setWeather] = useState<HkWeather | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/weather", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as HkWeather;
        if (!cancelled) setWeather(payload);
      } catch {
        // Keep the last reading on the kiosk if Observatory is briefly unreachable.
      }
    }
    void load();
    const id = window.setInterval(() => {
      void load();
    }, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  if (!weather) {
    return (
      <p className="whitespace-nowrap text-[13px] font-medium tracking-[0.1em] text-[#6b6458] uppercase">
        HK weather
      </p>
    );
  }

  const Icon = ICONS[weather.icon];
  return (
    <p
      className="flex items-center gap-2 whitespace-nowrap text-[13px] font-medium tracking-[0.1em] text-[#6b6458] uppercase"
      title={`Hong Kong Observatory · ${weather.condition}`}
    >
      <Icon className="size-4 shrink-0 text-[#c5a44e]" aria-hidden />
      <span>
        HK {Math.round(weather.temperatureC)}° · {weather.condition}
      </span>
    </p>
  );
}
