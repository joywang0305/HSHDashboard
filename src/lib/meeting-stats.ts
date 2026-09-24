import { TIMEZONE } from "@/lib/time";
import type { MeetingStats } from "@/lib/types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const POT_TOWER = "Peninsula Office Tower";
const SGB = "St. George's Building";

function heatmap() {
  const cells: MeetingStats["heatmap"] = [];
  let max = 0;
  for (let weekday = 0; weekday < 7; weekday += 1) {
    for (let hour = 7; hour < 19; hour += 1) {
      const weekend = weekday >= 5;
      const dist = Math.abs(hour - 10);
      const hours = weekend
        ? Math.max(2, 8 - dist)
        : Math.max(6, 22 - dist * 3) * (weekday === 2 ? 1.15 : weekday === 4 ? 0.9 : 1);
      cells.push({ weekday, hour, hours });
      max = Math.max(max, hours);
    }
  }
  return { cells, max };
}

const { cells: heatmapCells, max: heatmapMax } = heatmap();

/** Static mock for the kiosk dashboard — not derived from live bookings. */
export const MOCK_MEETING_STATS: MeetingStats = {
  generatedAt: "2026-09-09T00:00:00.000Z",
  timezone: TIMEZONE,
  asOf: "2026-09-09",
  bookableRoomCount: 18,
  occupancy: [
    {
      key: "day",
      label: "Day",
      bookedRooms: 14,
      availableRooms: 4,
      bookedHours: 62,
      availableHours: 154,
      utilisation: 0.29,
    },
    {
      key: "week",
      label: "Week",
      bookedRooms: 12,
      availableRooms: 6,
      bookedHours: 188,
      availableHours: 1324,
      utilisation: 0.12,
    },
    {
      key: "month",
      label: "Month",
      bookedRooms: 11,
      availableRooms: 7,
      bookedHours: 672,
      availableHours: 5808,
      utilisation: 0.1,
    },
  ],
  hours: [
    {
      key: "day",
      label: "Day",
      hours: 62,
      meetings: 48,
      byBuilding: [
        { code: "POT", name: POT_TOWER, hours: 49 },
        { code: "SGB", name: SGB, hours: 13 },
      ],
    },
    {
      key: "week",
      label: "Week",
      hours: 188,
      meetings: 142,
      byBuilding: [
        { code: "POT", name: POT_TOWER, hours: 154 },
        { code: "SGB", name: SGB, hours: 34 },
      ],
    },
    {
      key: "month",
      label: "Month",
      hours: 672,
      meetings: 510,
      byBuilding: [
        { code: "POT", name: POT_TOWER, hours: 548 },
        { code: "SGB", name: SGB, hours: 124 },
      ],
    },
    {
      key: "year",
      label: "Year",
      hours: 7640,
      meetings: 5820,
      byBuilding: [
        { code: "POT", name: POT_TOWER, hours: 6280 },
        { code: "SGB", name: SGB, hours: 1360 },
      ],
    },
  ],
  hoursByMonth: [
    { key: "2025-10", label: "Oct", pto: 510, sgb: 108, total: 618 },
    { key: "2025-11", label: "Nov", pto: 548, sgb: 116, total: 664 },
    { key: "2025-12", label: "Dec", pto: 420, sgb: 88, total: 508 },
    { key: "2026-01", label: "Jan", pto: 390, sgb: 82, total: 472 },
    { key: "2026-02", label: "Feb", pto: 470, sgb: 98, total: 568 },
    { key: "2026-03", label: "Mar", pto: 560, sgb: 122, total: 682 },
    { key: "2026-04", label: "Apr", pto: 538, sgb: 118, total: 656 },
    { key: "2026-05", label: "May", pto: 552, sgb: 120, total: 672 },
    { key: "2026-06", label: "Jun", pto: 530, sgb: 114, total: 644 },
    { key: "2026-07", label: "Jul", pto: 498, sgb: 110, total: 608 },
    { key: "2026-08", label: "Aug", pto: 544, sgb: 126, total: 670 },
    { key: "2026-09", label: "Sep", pto: 720, sgb: 158, total: 878 },
  ],
  hoursByFloor: [
    { floorId: "POT12F", label: "POT 12F", building: POT_TOWER, hours: 2380 },
    { floorId: "POT4F", label: "POT 4F", building: POT_TOWER, hours: 1760 },
    { floorId: "POT14F", label: "POT 14F", building: POT_TOWER, hours: 1540 },
    { floorId: "SGB8F", label: "SGB 8F", building: SGB, hours: 1360 },
    { floorId: "POT5F", label: "POT 5F", building: POT_TOWER, hours: 600 },
  ],
  hoursByWeekday: [
    { weekday: 0, label: "Mon", hours: 1280 },
    { weekday: 1, label: "Tue", hours: 1420 },
    { weekday: 2, label: "Wed", hours: 1510 },
    { weekday: 3, label: "Thu", hours: 1380 },
    { weekday: 4, label: "Fri", hours: 1210 },
    { weekday: 5, label: "Sat", hours: 460 },
    { weekday: 6, label: "Sun", hours: 380 },
  ],
  heatmap: heatmapCells,
  heatmapMax,
  topRooms: [
    { roomId: "sgb8-boardroom", name: "Boardroom", floor: "SGB 8F", hours: 660, meetings: 420 },
    { roomId: "pot14-meeting-north", name: "North Meeting", floor: "POT 14F", hours: 620, meetings: 390 },
    { roomId: "pot5-meeting", name: "Meeting", floor: "POT 5F", hours: 600, meetings: 410 },
    { roomId: "pot12-meeting-12", name: "Meeting 12", floor: "POT 12F", hours: 560, meetings: 480 },
    { roomId: "pot12-meeting-10", name: "Meeting 10", floor: "POT 12F", hours: 530, meetings: 470 },
  ],
  dailyHours: [
    { date: "2026-08-27", label: "Thu 27", hours: 58 },
    { date: "2026-08-28", label: "Fri 28", hours: 52 },
    { date: "2026-08-29", label: "Sat 29", hours: 18 },
    { date: "2026-08-30", label: "Sun 30", hours: 12 },
    { date: "2026-08-31", label: "Mon 31", hours: 64 },
    { date: "2026-09-01", label: "Tue 1", hours: 71 },
    { date: "2026-09-02", label: "Wed 2", hours: 68 },
    { date: "2026-09-03", label: "Thu 3", hours: 62 },
    { date: "2026-09-04", label: "Fri 4", hours: 54 },
    { date: "2026-09-05", label: "Sat 5", hours: 16 },
    { date: "2026-09-06", label: "Sun 6", hours: 10 },
    { date: "2026-09-07", label: "Mon 7", hours: 66 },
    { date: "2026-09-08", label: "Tue 8", hours: 70 },
    { date: "2026-09-09", label: "Wed 9", hours: 62 },
  ],
  averageMinutes: 63,
  peakHour: { hour: 9, label: "09:00", hours: 26 },
  utilisationYear: 0.1,
  busiestFloor: { label: "POT 12F", hours: 2380 },
};

export const WEEKDAY_LABELS = [...WEEKDAYS];
export const BUSINESS_HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
