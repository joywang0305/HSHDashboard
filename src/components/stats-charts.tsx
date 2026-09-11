"use client";

import { useId } from "react";

const PENINSULA = "#004b49";
const GOLD = "#c5a44e";
const MUTED = "#6b6458";
const INK = "#1c1914";
const TRACK = "#efe8da";

export function formatHours(value: number, compact = false) {
  if (compact && value >= 1000) {
    return `${(value / 1000).toFixed(value >= 10_000 ? 0 : 1)}k`;
  }
  if (value >= 100) return String(Math.round(value));
  return value.toLocaleString("en-HK", {
    maximumFractionDigits: 1,
    minimumFractionDigits: value > 0 && value < 10 ? 1 : 0,
  });
}

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function heatColor(t: number) {
  if (t <= 0) return TRACK;
  const mix = 0.16 + t * 0.84;
  const cream = [255, 252, 247];
  const ink = [0, 75, 73];
  const channel = (from: number, to: number) =>
    Math.round(from + (to - from) * mix);
  return `rgb(${channel(cream[0], ink[0])} ${channel(cream[1], ink[1])} ${channel(cream[2], ink[2])})`;
}

function niceMax(value: number) {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const scaled = value / magnitude;
  const nice = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 5 ? 5 : 10;
  return nice * magnitude;
}

type PaintKey = "pot" | "sgb" | "free" | "booked";

function paintKey(color: string): PaintKey | null {
  const value = color.toLowerCase();
  if (value.includes("004b49") || value.includes("0,75,73")) return "pot";
  if (value.includes("c5a44e") || value.includes("197,164,78")) return "sgb";
  if (value.includes("d9cdb8") || value.includes("efe8da")) return "free";
  if (value.includes("9b2c2c")) return "booked";
  return null;
}

export function cssBlock(color: string, angle = 135) {
  switch (paintKey(color)) {
    case "pot":
      return `linear-gradient(${angle}deg, #0a5c59 0%, #004b49 55%, #003835 100%)`;
    case "sgb":
      return `linear-gradient(${angle}deg, #d4b56a 0%, #c5a44e 52%, #9a7d38 100%)`;
    case "free":
      return `linear-gradient(${angle}deg, #efe8da 0%, #d9cdb8 100%)`;
    case "booked":
      return `linear-gradient(${angle}deg, #b04545 0%, #9b2c2c 55%, #7a2222 100%)`;
    default:
      return color;
  }
}

function usePaintId() {
  return useId().replace(/:/g, "");
}

function smoothLine(points: { x: number; y: number }[], command: "M" | "L" = "M") {
  if (points.length === 0) return "";
  if (points.length === 1) return `${command} ${points[0].x} ${points[0].y}`;
  if (points.length === 2) {
    return `${command} ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }
  let path = `${command} ${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] ?? points[index];
    const current = points[index];
    const next = points[index + 1];
    const after = points[index + 2] ?? next;
    const c1x = current.x + (next.x - previous.x) / 6;
    const c1y = current.y + (next.y - previous.y) / 6;
    const c2x = next.x - (after.x - current.x) / 6;
    const c2y = next.y - (after.y - current.y) / 6;
    path += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${next.x} ${next.y}`;
  }
  return path;
}

function svgFill(id: string, color: string, variant: "block" | "area" = "block") {
  const key = paintKey(color);
  if (!key) return color;
  return `url(#${id}-${key}${variant === "area" ? "-area" : ""})`;
}

function GradientDefs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-pot`} x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="#003835" />
        <stop offset="55%" stopColor="#004b49" />
        <stop offset="100%" stopColor="#0a5c59" />
      </linearGradient>
      <linearGradient id={`${id}-sgb`} x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="#9a7d38" />
        <stop offset="55%" stopColor="#c5a44e" />
        <stop offset="100%" stopColor="#d4b56a" />
      </linearGradient>
      <linearGradient id={`${id}-free`} x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="#cfc3ad" />
        <stop offset="100%" stopColor="#efe8da" />
      </linearGradient>
      <linearGradient id={`${id}-booked`} x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="#7a2222" />
        <stop offset="55%" stopColor="#9b2c2c" />
        <stop offset="100%" stopColor="#b04545" />
      </linearGradient>
      <linearGradient id={`${id}-pot-area`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0a5c59" stopOpacity="0.72" />
        <stop offset="55%" stopColor="#004b49" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#003835" stopOpacity="0.16" />
      </linearGradient>
      <linearGradient id={`${id}-sgb-area`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#d4b56a" stopOpacity="0.7" />
        <stop offset="50%" stopColor="#c5a44e" stopOpacity="0.48" />
        <stop offset="100%" stopColor="#9a7d38" stopOpacity="0.14" />
      </linearGradient>
      <linearGradient id={`${id}-across`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#003835" />
        <stop offset="55%" stopColor="#004b49" />
        <stop offset="100%" stopColor="#0a5c59" />
      </linearGradient>
      <radialGradient id={`${id}-radar`} cx="38%" cy="32%" r="72%">
        <stop offset="0%" stopColor="#0a5c59" stopOpacity="0.55" />
        <stop offset="55%" stopColor="#004b49" stopOpacity="0.38" />
        <stop offset="100%" stopColor="#003835" stopOpacity="0.22" />
      </radialGradient>
    </defs>
  );
}

export function ChartLegend({
  items,
}: {
  items: { label: string; color: string }[];
}) {
  return (
    <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
      {items.map((item) => (
        <li
          key={item.label}
          className="flex items-center gap-1.5 text-xs tracking-[0.12em] text-[#6b6458] uppercase xl:text-sm"
        >
          <span
            className="size-2.5 shrink-0 xl:size-3"
            style={{ background: cssBlock(item.color, 135) }}
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

export function StackedBarChart({
  categories,
  series,
}: {
  categories: { label: string; values: Record<string, number> }[];
  series: { key: string; label: string; color: string }[];
}) {
  const width = 420;
  const height = 220;
  const pad = { top: 18, right: 12, bottom: 44, left: 52 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = niceMax(
    Math.max(
      0,
      ...categories.map((category) =>
        series.reduce((sum, item) => sum + (category.values[item.key] ?? 0), 0),
      ),
    ),
  );
  const gap = 18;
  const barW = Math.min(56, (innerW - gap * (categories.length - 1)) / categories.length);
  const paintId = usePaintId();

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full min-h-0 w-full flex-1" role="img">
      <GradientDefs id={paintId} />
      {[0, 0.5, 1].map((tick) => {
        const y = pad.top + innerH * (1 - tick);
        return (
          <g key={tick}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={y}
              y2={y}
              stroke={TRACK}
              strokeWidth="1"
            />
            <text
              x={pad.left - 8}
              y={y + 3}
              textAnchor="end"
              fill={MUTED}
              fontSize="13"
            >
              {formatHours(max * tick, true)}
            </text>
          </g>
        );
      })}
      {categories.map((category, index) => {
        const x =
          pad.left +
          (innerW - barW * categories.length - gap * (categories.length - 1)) / 2 +
          index * (barW + gap);
        let y = pad.top + innerH;
        return (
          <g key={category.label}>
            {series.map((item) => {
              const value = category.values[item.key] ?? 0;
              const h = max === 0 ? 0 : (value / max) * innerH;
              y -= h;
              const rect = (
                <rect
                  key={item.key}
                  x={x}
                  y={y}
                  width={barW}
                  height={Math.max(0, h)}
                  fill={svgFill(paintId, item.color)}
                />
              );
              return rect;
            })}
            <text
              x={x + barW / 2}
              y={height - 14}
              textAnchor="middle"
              fill={INK}
              fontSize="14"
              letterSpacing="0.08em"
            >
              {category.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function GroupedBarChart({
  categories,
  series,
}: {
  categories: { label: string; values: Record<string, number> }[];
  series: { key: string; label: string; color: string }[];
}) {
  const width = 460;
  const height = 220;
  const pad = { top: 18, right: 10, bottom: 44, left: 54 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = niceMax(
    Math.max(
      0,
      ...categories.flatMap((category) =>
        series.map((item) => category.values[item.key] ?? 0),
      ),
    ),
  );
  const groupW = innerW / categories.length;
  const barW = Math.min(22, (groupW - 16) / series.length);
  const paintId = usePaintId();

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full min-h-0 w-full flex-1" role="img">
      <GradientDefs id={paintId} />
      {[0, 0.5, 1].map((tick) => {
        const y = pad.top + innerH * (1 - tick);
        return (
          <g key={tick}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={y}
              y2={y}
              stroke={TRACK}
              strokeWidth="1"
            />
            <text
              x={pad.left - 8}
              y={y + 3}
              textAnchor="end"
              fill={MUTED}
              fontSize="13"
            >
              {formatHours(max * tick, true)}
            </text>
          </g>
        );
      })}
      {categories.map((category, index) => {
        const gx = pad.left + index * groupW;
        const cluster = barW * series.length + 4 * (series.length - 1);
        const start = gx + (groupW - cluster) / 2;
        return (
          <g key={category.label}>
            {series.map((item, seriesIndex) => {
              const value = category.values[item.key] ?? 0;
              const h = (value / max) * innerH;
              const x = start + seriesIndex * (barW + 4);
              const y = pad.top + innerH - h;
              return (
                <rect
                  key={item.key}
                  x={x}
                  y={y}
                  width={barW}
                  height={h}
                  fill={svgFill(paintId, item.color)}
                />
              );
            })}
            <text
              x={gx + groupW / 2}
              y={height - 14}
              textAnchor="middle"
              fill={INK}
              fontSize="14"
              letterSpacing="0.08em"
            >
              {category.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function StackedAreaChart({
  points,
  series,
}: {
  points: { label: string; values: Record<string, number> }[];
  series: { key: string; color: string; fill: string }[];
}) {
  const width = 640;
  const height = 240;
  const pad = { top: 18, right: 16, bottom: 48, left: 56 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const totals = points.map((point) =>
    series.reduce((sum, item) => sum + (point.values[item.key] ?? 0), 0),
  );
  const max = niceMax(Math.max(0, ...totals));
  const step = points.length > 1 ? innerW / (points.length - 1) : innerW;
  const stacked = points.map((point) => {
    let y = 0;
    return series.map((item) => {
      const value = point.values[item.key] ?? 0;
      const from = y;
      y += value;
      return { from, to: y };
    });
  });

  function xAt(index: number) {
    return pad.left + index * step;
  }
  function yAt(value: number) {
    return pad.top + innerH - (value / max) * innerH;
  }
  const paintId = usePaintId();

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full min-h-0 w-full flex-1" role="img">
      <GradientDefs id={paintId} />
      {[0, 0.5, 1].map((tick) => {
        const y = yAt(max * tick);
        return (
          <g key={tick}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={y}
              y2={y}
              stroke={TRACK}
              strokeWidth="1"
            />
            <text
              x={pad.left - 8}
              y={y + 3}
              textAnchor="end"
              fill={MUTED}
              fontSize="13"
            >
              {formatHours(max * tick, true)}
            </text>
          </g>
        );
      })}
      {series.map((item, seriesIndex) => {
        const topPoints = stacked.map((row, index) => ({
          x: xAt(index),
          y: yAt(row[seriesIndex].to),
        }));
        const bottomPoints = stacked.map((row, index) => ({
          x: xAt(index),
          y: yAt(row[seriesIndex].from),
        }));
        const line = smoothLine(topPoints);
        const area = `${line} ${smoothLine([...bottomPoints].reverse(), "L")} Z`;
        return (
          <g key={item.key}>
            <path d={area} fill={svgFill(paintId, item.color, "area")} />
            <path
              d={line}
              fill="none"
              stroke={svgFill(paintId, item.color)}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </g>
        );
      })}
      {points.map((point, index) =>
        index % 2 === 0 || index === points.length - 1 ? (
          <text
            key={point.label}
            x={xAt(index)}
            y={height - 14}
            textAnchor="middle"
            fill={MUTED}
            fontSize="13"
          >
            {point.label}
          </text>
        ) : null,
      )}
    </svg>
  );
}

export function DonutChart({
  segments,
  center,
}: {
  segments: { label: string; value: number; color: string }[];
  center: { title: string; subtitle: string };
}) {
  const size = 220;
  const radius = 74;
  const stroke = 22;
  const cx = size / 2;
  const cy = size / 2 - 4;
  const circ = 2 * Math.PI * radius;
  const total = segments.reduce((sum, item) => sum + item.value, 0) || 1;
  let offset = 0;
  const paintId = usePaintId();

  return (
    <svg viewBox={`0 0 ${size} ${size + 8}`} className="mx-auto h-full min-h-0 w-full" role="img">
      <GradientDefs id={paintId} />
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={TRACK}
        strokeWidth={stroke}
      />
      {segments.map((segment) => {
        const length = (segment.value / total) * circ;
        const circle = (
          <circle
            key={segment.label}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={svgFill(paintId, segment.color)}
            strokeWidth={stroke}
            strokeDasharray={`${length} ${circ - length}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        );
        offset += length;
        return circle;
      })}
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        fill={PENINSULA}
        fontSize="32"
        fontFamily="var(--font-cormorant), serif"
      >
        {center.title}
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        fill={MUTED}
        fontSize="13"
        letterSpacing="0.14em"
      >
        {center.subtitle}
      </text>
    </svg>
  );
}

export function HorizontalBarChart({
  items,
  color = PENINSULA,
}: {
  items: { label: string; value: number; hint?: string }[];
  color?: string;
}) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <ul className="flex min-h-0 flex-1 flex-col justify-center space-y-2">
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="truncate text-sm text-[#004b49] xl:text-base">{item.label}</span>
            <span className="shrink-0 text-xs tracking-[0.06em] text-[#6b6458] uppercase xl:text-sm">
              {item.hint ?? `${formatHours(item.value)} h`}
            </span>
          </div>
          <div className="h-2.5 bg-[#efe8da] xl:h-3">
            <div
              className="h-full"
              style={{
                width: `${(item.value / max) * 100}%`,
                background: cssBlock(color, 90),
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function HeatmapChart({
  cells,
  max,
  weekdays,
  hours,
}: {
  cells: { weekday: number; hour: number; hours: number }[];
  max: number;
  weekdays: string[];
  hours: number[];
}) {
  const lookup = new Map(
    cells.map((cell) => [`${cell.weekday}-${cell.hour}`, cell.hours]),
  );
  return (
    <div className="min-h-0 flex-1 overflow-hidden">
      <div
        className="grid h-full min-h-0 gap-0.5"
        style={{
          gridTemplateColumns: `2.6rem repeat(${hours.length}, minmax(0, 1fr))`,
          gridTemplateRows: `auto repeat(${weekdays.length}, minmax(0, 1fr))`,
        }}
      >
        <span />
        {hours.map((hour) => (
          <span
            key={hour}
            className="text-center text-xs tracking-[0.06em] text-[#6b6458] xl:text-sm"
          >
            {String(hour).padStart(2, "0")}
          </span>
        ))}
        {weekdays.map((label, weekday) => (
          <div key={label} className="contents">
            <span className="self-center text-xs tracking-[0.08em] text-[#6b6458] uppercase xl:text-sm">
              {label}
            </span>
            {hours.map((hour) => {
              const value = lookup.get(`${weekday}-${hour}`) ?? 0;
              const t = Math.min(1, value / max);
              return (
                <div
                  key={`${weekday}-${hour}`}
                  title={`${label} ${String(hour).padStart(2, "0")}:00 · ${formatHours(value)} h`}
                  className="min-h-0"
                  style={{ background: heatColor(t) }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

const RADAR_WEEKDAY: Record<string, string> = {
  mon: "M",
  monday: "M",
  tue: "TU",
  tues: "TU",
  tuesday: "TU",
  wed: "W",
  wednesday: "W",
  thu: "TH",
  thur: "TH",
  thurs: "TH",
  thursday: "TH",
  fri: "F",
  friday: "F",
  sat: "SA",
  saturday: "SA",
  sun: "SU",
  sunday: "SU",
};

function radarAxisLabel(label: string) {
  return RADAR_WEEKDAY[label.trim().toLowerCase()] ?? label;
}

function radarAxisAnchor(angle: number) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  return {
    anchor: dx > 0.35 ? "start" : dx < -0.35 ? "end" : "middle",
    dy: dy > 0.35 ? "1.05em" : dy < -0.35 ? "-0.35em" : "0.35em",
  };
}

export function RadarChart({
  items,
}: {
  items: { label: string; value: number }[];
}) {
  const size = 248;
  const cx = 124;
  const cy = 124;
  const radius = 86;
  const labelRadius = 106;
  const max = niceMax(Math.max(0, ...items.map((item) => item.value)));
  const axes = items.map((item, index) => {
    const angle = -Math.PI / 2 + (index / items.length) * Math.PI * 2;
    const r = (item.value / max) * radius;
    const { anchor, dy } = radarAxisAnchor(angle);
    return {
      angle,
      label: radarAxisLabel(item.label),
      hours: item.value,
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
      labelX: cx + Math.cos(angle) * labelRadius,
      labelY: cy + Math.sin(angle) * labelRadius,
      axisX: cx + Math.cos(angle) * radius,
      axisY: cy + Math.sin(angle) * radius,
      anchor,
      dy,
    };
  });
  const polygon = axes.map((point) => `${point.x},${point.y}`).join(" ");
  const paintId = usePaintId();

  return (
    <div className="flex min-h-0 flex-1 items-center gap-2 overflow-hidden xl:gap-3">
      <ul className="flex h-full min-h-0 w-[4.25rem] shrink-0 flex-col justify-evenly xl:w-[5.5rem]">
        {axes.map((item) => (
          <li
            key={item.label}
            className="flex min-h-0 items-baseline justify-between gap-1.5"
          >
            <span className="text-[11px] tracking-[0.08em] text-[#6b6458] uppercase xl:text-sm 2xl:text-base">
              {item.label}
            </span>
            <span className="shrink-0 text-[11px] tabular-nums text-[#004b49] xl:text-sm">
              {formatHours(item.hours, true)}
            </span>
          </li>
        ))}
      </ul>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="h-full min-h-0 min-w-0 flex-1"
        role="img"
        aria-hidden="true"
      >
        <GradientDefs id={paintId} />
        {[0.33, 0.66, 1].map((tick) => (
          <polygon
            key={tick}
            fill="none"
            stroke={TRACK}
            points={axes
              .map((axis) => {
                const r = radius * tick;
                return `${cx + Math.cos(axis.angle) * r},${cy + Math.sin(axis.angle) * r}`;
              })
              .join(" ")}
          />
        ))}
        {axes.map((axis) => (
          <line
            key={`axis-${axis.label}`}
            x1={cx}
            y1={cy}
            x2={axis.axisX}
            y2={axis.axisY}
            stroke={TRACK}
          />
        ))}
        <polygon
          points={polygon}
          fill={`url(#${paintId}-radar)`}
          stroke={`url(#${paintId}-sgb)`}
          strokeWidth="2.5"
        />
        {axes.map((axis) => (
          <text
            key={`label-${axis.label}`}
            x={axis.labelX}
            y={axis.labelY}
            dy={axis.dy}
            textAnchor={axis.anchor}
            fill={MUTED}
            fontSize="13"
            fontFamily="var(--font-outfit), sans-serif"
            letterSpacing="0.08em"
          >
            {axis.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

export function GaugeChart({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  const clamped = Math.min(1, Math.max(0, value));
  const radius = 78;
  const cx = 110;
  const cy = 100;
  const circ = Math.PI * radius;
  const dash = clamped * circ;
  const paintId = usePaintId();

  return (
    <svg
      viewBox="0 0 220 140"
      preserveAspectRatio="xMinYMid meet"
      className="h-full min-h-0 w-full flex-1"
      role="img"
    >
      <GradientDefs id={paintId} />
      <path
        d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
        fill="none"
        stroke={TRACK}
        strokeWidth="16"
        strokeLinecap="butt"
      />
      <path
        d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
        fill="none"
        stroke={`url(#${paintId}-across)`}
        strokeWidth="16"
        strokeDasharray={`${dash} ${circ}`}
      />
      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        fill={PENINSULA}
        fontSize="36"
        fontFamily="var(--font-cormorant), serif"
      >
        {formatPercent(clamped)}
      </text>
      <text
        x={cx}
        y={cy + 16}
        textAnchor="middle"
        fill={MUTED}
        fontSize="13"
        letterSpacing="0.16em"
      >
        {label}
      </text>
    </svg>
  );
}

export function SparkAreaChart({
  points,
}: {
  points: { label: string; value: number }[];
}) {
  const width = 520;
  const height = 180;
  const pad = { top: 12, right: 10, bottom: 44, left: 10 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = niceMax(Math.max(0, ...points.map((point) => point.value)));
  const step = points.length > 1 ? innerW / (points.length - 1) : innerW;
  const coords = points.map((point, index) => ({
    x: pad.left + index * step,
    y: pad.top + innerH - (point.value / max) * innerH,
  }));
  const line = smoothLine(coords);
  const last = coords[coords.length - 1] ?? { x: pad.left, y: pad.top + innerH };
  const area = `${line} L ${last.x} ${pad.top + innerH} L ${pad.left} ${pad.top + innerH} Z`;
  const paintId = usePaintId();

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full min-h-0 w-full flex-1" role="img">
      <GradientDefs id={paintId} />
      <path d={area} fill={svgFill(paintId, GOLD, "area")} />
      <path
        d={line}
        fill="none"
        stroke={svgFill(paintId, PENINSULA)}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {coords.map((point, index) => (
        <circle
          key={points[index].label}
          cx={point.x}
          cy={point.y}
          r="3.5"
          fill={`url(#${paintId}-sgb)`}
        />
      ))}
      {points.map((point, index) =>
        index % 2 === 0 || index === points.length - 1 ? (
          <text
            key={point.label}
            x={coords[index].x}
            y={height - 16}
            textAnchor="middle"
            fill={MUTED}
            fontSize="13"
          >
            {point.label.replace(/^\w{3} /, "")}
          </text>
        ) : null,
      )}
    </svg>
  );
}
