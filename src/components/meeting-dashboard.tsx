"use client";

import { type ReactNode } from "react";
import {
  ChartLegend,
  DonutChart,
  GaugeChart,
  GroupedBarChart,
  HeatmapChart,
  HorizontalBarChart,
  RadarChart,
  SparkAreaChart,
  StackedAreaChart,
  StackedBarChart,
  formatHours,
  formatPercent,
} from "@/components/stats-charts";
import {
  BUSINESS_HOURS,
  MOCK_MEETING_STATS,
  WEEKDAY_LABELS,
} from "@/lib/meeting-stats";

const POT = "#004b49";
const SGB = "#c5a44e";
const FREE = "#d9cdb8";
const stats = MOCK_MEETING_STATS;
const year = stats.hours.find((item) => item.key === "year")!;
const month = stats.hours.find((item) => item.key === "month")!;
const week = stats.hours.find((item) => item.key === "week")!;
const day = stats.hours.find((item) => item.key === "day")!;
const potYear = year.byBuilding.find((item) => item.code === "POT")?.hours ?? 0;
const sgbYear = year.byBuilding.find((item) => item.code === "SGB")?.hours ?? 0;

function Card({
  title,
  children,
  className = "",
  titleSide = false,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  titleSide?: boolean;
}) {
  if (titleSide) {
    return (
      <section
        className={`flex min-h-0 overflow-hidden border border-[#d9cdb8] bg-white p-3 xl:p-4 ${className}`}
      >
        <div className="mr-2 flex shrink-0 items-center gap-2 xl:mr-3">
          <h2 className="shrink-0 [writing-mode:vertical-rl] rotate-180 text-xs tracking-[0.18em] text-[#c5a44e] uppercase xl:text-sm 2xl:text-base">
            {title}
          </h2>
          <span className="block h-8 w-px shrink-0 bg-[#c5a44e]" />
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 items-stretch">{children}</div>
      </section>
    );
  }

  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden border border-[#d9cdb8] bg-white p-3 xl:p-4 ${className}`}
    >
      <h2 className="shrink-0 text-xs tracking-[0.18em] text-[#c5a44e] uppercase xl:text-sm 2xl:text-base">
        {title}
      </h2>
      <span className="mt-1 mb-2 block h-px w-8 shrink-0 bg-[#c5a44e]" />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </section>
  );
}

function Kpi({
  label,
  value,
  hint,
  invert = false,
}: {
  label: string;
  value: string;
  hint: string;
  invert?: boolean;
}) {
  return (
    <div
      className={
        invert
          ? "flex h-full min-w-0 flex-col justify-center border border-[#c5a44e]/50 px-3 py-2 text-[#f7f3eb] xl:px-4 xl:py-3"
          : "flex h-full min-w-0 flex-col justify-center border border-[#d9cdb8] px-3 py-2 xl:px-4 xl:py-3"
      }
      style={{
        background: invert
          ? "linear-gradient(145deg, #0a5c59 0%, #004b49 55%, #003835 100%)"
          : "linear-gradient(180deg, #ffffff 0%, #f7f3eb 100%)",
      }}
    >
      <p className="text-xs tracking-[0.16em] text-[#c5a44e] uppercase xl:text-sm">
        {label}
      </p>
      <p
        className={`mt-1 text-3xl leading-none xl:text-4xl 2xl:text-5xl ${invert ? "text-[#f7f3eb]" : "text-[#004b49]"}`}
        style={{ fontFamily: "var(--font-cormorant), serif" }}
      >
        {value}
      </p>
      <p
        className={`mt-1 truncate text-xs xl:text-sm ${invert ? "text-white/70" : "text-[#6b6458]"}`}
      >
        {hint}
      </p>
    </div>
  );
}

export function MeetingDashboard() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f7f3eb]">
      <header className="shrink-0 border-b border-[#d9cdb8] bg-white px-4 py-2.5 text-center xl:py-3">
        <p className="text-xs tracking-[0.32em] text-[#c5a44e] uppercase xl:text-sm">
          Meeting intelligence
        </p>
        <h1
          className="text-3xl font-medium italic leading-tight text-[#004b49] xl:text-4xl 2xl:text-5xl"
          style={{ fontFamily: "var(--font-cormorant), serif" }}
        >
          Workplace dashboard
        </h1>
      </header>
      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1fr)] gap-2 p-2 md:p-3">
        <div className="grid min-h-0 gap-2 lg:grid-cols-12">
          <div className="grid min-h-0 grid-cols-2 grid-rows-2 gap-2 lg:col-span-3">
            <Kpi
              invert
              label="Hours today"
              value={formatHours(day.hours)}
              hint={`${day.meetings} meetings · ${stats.bookableRoomCount} rooms`}
            />
            <Kpi
              label="Past 7 days"
              value={formatHours(week.hours)}
              hint={`${week.meetings} meetings`}
            />
            <Kpi
              label="Past 30 days"
              value={formatHours(month.hours)}
              hint={`${month.meetings} meetings`}
            />
            <Kpi
              label="Past 12 months"
              value={formatHours(year.hours, true)}
              hint={`${year.meetings} meetings`}
            />
          </div>
          <Card title="Rooms booked vs available" className="lg:col-span-3">
            <StackedBarChart
              categories={stats.occupancy.map((item) => ({
                label: item.label,
                values: {
                  booked: item.bookedRooms,
                  available: item.availableRooms,
                },
              }))}
              series={[
                { key: "booked", label: "Booked", color: POT },
                { key: "available", label: "Available", color: FREE },
              ]}
            />
            <ChartLegend
              items={[
                { label: "Booked", color: POT },
                { label: "Available", color: FREE },
              ]}
            />
          </Card>
          <Card title="Hours by building · year" className="lg:col-span-3">
            <DonutChart
              segments={[
                { label: "POT", value: potYear, color: POT },
                { label: "SGB", value: sgbYear, color: SGB },
              ]}
              center={{
                title: formatHours(year.hours, true),
                subtitle: "HOURS / YEAR",
              }}
            />
            <ChartLegend
              items={[
                { label: "POT", color: POT },
                { label: "SGB", color: SGB },
              ]}
            />
          </Card>
          <Card title="Hours · day / week / month" className="lg:col-span-3">
            <GroupedBarChart
              categories={stats.hours
                .filter((item) => item.key !== "year")
                .map((item) => ({
                  label: item.label,
                  values: {
                    pot:
                      item.byBuilding.find((building) => building.code === "POT")
                        ?.hours ?? 0,
                    sgb:
                      item.byBuilding.find((building) => building.code === "SGB")
                        ?.hours ?? 0,
                  },
                }))}
              series={[
                { key: "pot", label: "POT", color: POT },
                { key: "sgb", label: "SGB", color: SGB },
              ]}
            />
            <ChartLegend
              items={[
                { label: "POT", color: POT },
                { label: "SGB", color: SGB },
              ]}
            />
          </Card>
        </div>

        <div className="grid min-h-0 gap-2 lg:grid-cols-12">
          <Card title="Meeting hours · 12 months" className="lg:col-span-4">
            <StackedAreaChart
              points={stats.hoursByMonth.map((item) => ({
                label: item.label,
                values: { pot: item.pto, sgb: item.sgb },
              }))}
              series={[
                { key: "pot", color: POT, fill: "rgba(0,75,73,0.55)" },
                { key: "sgb", color: SGB, fill: "rgba(197,164,78,0.55)" },
              ]}
            />
          </Card>
          <Card title="Weekday mix" className="lg:col-span-3">
            <RadarChart
              items={stats.hoursByWeekday.map((item) => ({
                label: item.label,
                value: item.hours,
              }))}
            />
          </Card>
          <Card title="When rooms are busiest" className="lg:col-span-5">
            <HeatmapChart
              cells={stats.heatmap}
              max={stats.heatmapMax}
              weekdays={WEEKDAY_LABELS}
              hours={BUSINESS_HOURS}
            />
            <p className="mt-1.5 shrink-0 text-xs text-[#6b6458] xl:text-sm">
              Peak {stats.peakHour.label} · busiest {stats.busiestFloor?.label}
            </p>
          </Card>
        </div>

        <div className="grid min-h-0 gap-2 lg:grid-cols-12">
          <Card title="Hours by floor" className="lg:col-span-3">
            <HorizontalBarChart
              items={stats.hoursByFloor.map((item) => ({
                label: item.label,
                value: item.hours,
              }))}
            />
          </Card>
          <Card title="Most used rooms" className="lg:col-span-3">
            <HorizontalBarChart
              color={SGB}
              items={stats.topRooms.map((item) => ({
                label: `${item.name} · ${item.floor}`,
                value: item.hours,
                hint: `${formatHours(item.hours)} h`,
              }))}
            />
          </Card>
          <Card title="Last 14 days" className="lg:col-span-3">
            <SparkAreaChart
              points={stats.dailyHours.map((item) => ({
                label: item.label,
                value: item.hours,
              }))}
            />
          </Card>
          <div className="grid min-h-0 grid-rows-2 gap-2 lg:col-span-3">
            <Card title="Month use" titleSide>
              <GaugeChart
                value={
                  stats.occupancy.find((item) => item.key === "month")
                    ?.utilisation ?? 0
                }
                label="UTILISATION"
              />
            </Card>
            <Kpi
              invert
              label="Avg · year"
              value={`${stats.averageMinutes}m`}
              hint={formatPercent(stats.utilisationYear)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
