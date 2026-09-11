"use client";

import { useEffect, useState } from "react";
import { clockInZone, WORLD_CITIES } from "@/lib/world-clocks";

const PENINSULA = "#004b49";
const PENINSULA_LIT = "#2a6f6c";
const PENINSULA_SHADE = "#002e2c";
const GOLD = "#c5a44e";
const IVORY = "#fffcf7";
const TRACK = "#d9cdb8";

const HOURS = ["12", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"];

function polar(angleDeg: number, radius: number) {
  const angle = ((angleDeg - 90) * Math.PI) / 180;
  return [100 + Math.cos(angle) * radius, 100 + Math.sin(angle) * radius] as const;
}

function AnalogFace({
  hour,
  minute,
  second,
  home = false,
}: {
  hour: number;
  minute: number;
  second: number;
  home?: boolean;
}) {
  const night = hour < 6 || hour >= 18;
  const afternoon = !night && hour >= 12;
  const meridiem = hour < 12 ? "AM" : "PM";
  const hourAngle = ((hour % 12) + minute / 60 + second / 3600) * 30;
  const minuteAngle = (minute + second / 60) * 6;
  const secondAngle = second * 6;
  const theme = night
    ? {
        bezel: home ? GOLD : "#1a3331",
        face: home ? "#0b201e" : "#0d2321",
        accent: GOLD,
        hourTick: GOLD,
        minuteTick: "#3f5f5b",
        inner: "#3f5f5b",
        dialStroke: GOLD,
        handLit: "#f0e2c0",
        handShade: GOLD,
        second: "#e8c96a",
        hubOuter: "#061614",
        hubMid: GOLD,
        hubPin: IVORY,
        meridiem: GOLD,
      }
    : afternoon
      ? {
          bezel: home ? GOLD : "#c5a44e",
          face: home ? "#f3e4bf" : "#f1e2bc",
          accent: PENINSULA,
          hourTick: PENINSULA,
          minuteTick: "#d4c29a",
          inner: "#c5a44e",
          dialStroke: home ? GOLD : PENINSULA,
          handLit: PENINSULA_LIT,
          handShade: PENINSULA_SHADE,
          second: GOLD,
          hubOuter: PENINSULA_SHADE,
          hubMid: GOLD,
          hubPin: "#1c1914",
          meridiem: PENINSULA,
        }
      : {
          bezel: home ? GOLD : "#b7aa94",
          face: home ? "#f7f3eb" : IVORY,
          accent: home ? GOLD : PENINSULA,
          hourTick: home ? GOLD : PENINSULA,
          minuteTick: TRACK,
          inner: TRACK,
          dialStroke: home ? GOLD : PENINSULA,
          handLit: PENINSULA_LIT,
          handShade: PENINSULA_SHADE,
          second: GOLD,
          hubOuter: PENINSULA_SHADE,
          hubMid: GOLD,
          hubPin: "#1c1914",
          meridiem: home ? GOLD : PENINSULA,
        };

  return (
    <svg
      viewBox="0 0 200 200"
      className="block h-full w-full"
      aria-label={night ? "Night" : afternoon ? "Afternoon" : "Morning"}
    >
      <circle cx="100" cy="100" r="99" fill={theme.bezel} />
      <circle
        cx="100"
        cy="100"
        r="96.5"
        fill={theme.face}
        stroke={theme.dialStroke}
        strokeWidth="1.1"
      />
      <circle cx="100" cy="100" r="92.6" fill="none" stroke={theme.dialStroke} strokeWidth="0.7" />
      <circle cx="100" cy="100" r="83.4" fill="none" stroke={theme.dialStroke} strokeWidth="0.7" />
      {Array.from({ length: 60 }, (_, index) => {
        const hourMark = index % 5 === 0;
        const [x1, y1] = polar(index * 6, hourMark ? 83.6 : 86.2);
        const [x2, y2] = polar(index * 6, 92.4);
        return (
          <line
            key={index}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={hourMark ? theme.hourTick : theme.minuteTick}
            strokeWidth={hourMark ? 1.85 : 0.7}
          />
        );
      })}
      {HOURS.map((label, index) => {
        const [x, y] = polar(index * 30, 65);
        return (
          <text
            key={label}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fill={theme.accent}
            fontFamily="var(--font-cinzel), serif"
            fontSize={label.length > 1 ? 14 : 15.5}
            fontWeight={500}
          >
            {label}
          </text>
        );
      })}
      <circle cx="100" cy="100" r="46" fill="none" stroke={theme.inner} strokeWidth="0.55" />
      <text
        x="100"
        y="78"
        textAnchor="middle"
        dominantBaseline="central"
        fill={theme.meridiem}
        fontFamily="var(--font-cinzel), serif"
        fontSize="11"
        fontWeight={600}
        letterSpacing="0.18em"
      >
        {meridiem}
      </text>
      <g transform={`rotate(${hourAngle} 100 100)`}>
        <polygon points="100,52 105.4,100 100,116" fill={theme.handLit} />
        <polygon points="100,52 94.6,100 100,116" fill={theme.handShade} />
      </g>
      <g transform={`rotate(${minuteAngle} 100 100)`}>
        <polygon points="100,22 103.6,100 100,118" fill={theme.handLit} />
        <polygon points="100,22 96.4,100 100,118" fill={theme.handShade} />
      </g>
      <g transform={`rotate(${secondAngle} 100 100)`}>
        <line
          x1="100"
          y1="132"
          x2="100"
          y2="18"
          stroke={theme.second}
          strokeWidth="0.95"
          strokeLinecap="round"
        />
        <circle cx="100" cy="132" r="3.5" fill={theme.second} />
      </g>
      <circle cx="100" cy="100" r="8.4" fill={theme.hubOuter} />
      <circle cx="100" cy="100" r="5.6" fill={theme.hubMid} />
      <circle cx="100" cy="100" r="2.15" fill={theme.hubPin} />
    </svg>
  );
}

export function WorldClockBoard() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f7f3eb]">
      <header className="shrink-0 border-b border-[#d9cdb8] bg-white px-4 py-2.5 text-center xl:py-3">
        <p className="text-xs tracking-[0.32em] text-[#c5a44e] uppercase xl:text-sm">
          Time across the Group
        </p>
        <h1
          className="text-3xl font-medium italic leading-tight text-[#004b49] xl:text-4xl 2xl:text-5xl"
          style={{ fontFamily: "var(--font-cormorant), serif" }}
        >
          World clock
        </h1>
      </header>
      <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-5 gap-2 p-2 sm:grid-cols-5 sm:grid-rows-2 md:p-3">
        {WORLD_CITIES.map((city) => {
          const clock = now ? clockInZone(now, city.timeZone) : null;
          const places =
            city.places.length > 1 ? city.places.join(" · ") : null;
          return (
            <section
              key={city.id}
              className="flex min-h-0 flex-col overflow-hidden border border-[#d9cdb8] bg-white px-3 py-3"
            >
              <div className="@container flex min-h-0 w-full flex-1 flex-col items-center justify-center">
              <h2
                className="max-w-full shrink-0 text-center leading-[1.05] font-medium text-[#004b49]"
                style={{
                  fontFamily: "var(--font-cormorant), serif",
                  fontSize: "clamp(1.15rem, 11.5cqi, 2.9rem)",
                }}
              >
                {city.name}
              </h2>
              {places ? (
                <p
                  className="mt-[0.5cqi] shrink-0 text-center tracking-[0.18em] text-[#c5a44e] uppercase"
                  style={{ fontSize: "clamp(0.55rem, 3.3cqi, 0.85rem)" }}
                >
                  {places}
                </p>
              ) : null}
              <div className="my-[3.2cqi] aspect-square w-1/2 shrink-0">
                <AnalogFace
                  hour={clock?.hour ?? 0}
                  minute={clock?.minute ?? 0}
                  second={clock?.second ?? 0}
                  home={city.home}
                />
              </div>
              <p
                className="shrink-0 leading-none text-[#004b49] tabular-nums"
                style={{
                  fontFamily: "var(--font-cormorant), serif",
                  fontSize: "clamp(1.05rem, 9.4cqi, 2.4rem)",
                }}
                suppressHydrationWarning
              >
                {clock?.digital ?? "--:--:-- --"}
              </p>
              <p
                className="mt-[1.6cqi] shrink-0 text-center font-medium leading-tight text-[#004b49]"
                style={{
                  fontFamily: "var(--font-cormorant), serif",
                  fontSize: "clamp(0.8rem, 5.6cqi, 1.35rem)",
                }}
              >
                {clock ? `${clock.weekday} ${clock.date}` : city.timeZone}
              </p>
              <p
                className="mt-[0.4cqi] shrink-0 text-center tracking-[0.16em] text-[#6b6458]"
                style={{ fontSize: "clamp(0.55rem, 3.1cqi, 0.9rem)" }}
              >
                {clock?.offset ?? ""}
              </p>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
