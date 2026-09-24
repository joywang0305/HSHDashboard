export type Room = {
  id: string;
  name: string;
  email: string;
  capacity: number;
  floor: string;
  equipment: string[];
};

export type BookingAttendee = {
  name: string;
  email?: string;
  status?: string;
};

export type Booking = {
  id: string;
  roomId: string;
  title: string;
  organizer: string;
  start: string;
  end: string;
  source: "outlook" | "kiosk";
  organizerEmail?: string;
  location?: string;
  attendees?: BookingAttendee[];
  teamsUrl?: string;
  showAs?: string;
  notes?: string;
  isPrivate?: boolean;
  isOnlineMeeting?: boolean;
};

export type HubStory = {
  id: string;
  title: string;
  summary: string;
  publishedAt: string;
  author: string;
  href: string;
};

export type SharePointItem = {
  id: string;
  name: string;
  library: string;
  modifiedAt: string;
  modifiedBy: string;
  href: string;
  kind: "page" | "document" | "list";
};

export type BoardPayload = {
  date: string;
  timezone: string;
  source: "mock" | "graph";
  kioskFloorId: string;
  rooms: Room[];
  bookings: Booking[];
  hub: HubStory[];
  sharepoint: SharePointItem[];
  dayStartHour: number;
  dayEndHour: number;
  inUseRoomIds: string[];
};

export type CreateBookingInput = {
  roomId: string;
  title: string;
  organizer: string;
  start: string;
  end: string;
};

export type OccupancyPeriod = {
  key: "day" | "week" | "month";
  label: string;
  bookedRooms: number;
  availableRooms: number;
  bookedHours: number;
  availableHours: number;
  utilisation: number;
};

export type HoursPeriod = {
  key: "day" | "week" | "month" | "year";
  label: string;
  hours: number;
  meetings: number;
  byBuilding: { code: string; name: string; hours: number }[];
};

export type MeetingStats = {
  generatedAt: string;
  timezone: string;
  asOf: string;
  bookableRoomCount: number;
  occupancy: OccupancyPeriod[];
  hours: HoursPeriod[];
  hoursByMonth: {
    key: string;
    label: string;
    pto: number;
    sgb: number;
    total: number;
  }[];
  hoursByFloor: {
    floorId: string;
    label: string;
    building: string;
    hours: number;
  }[];
  hoursByWeekday: { weekday: number; label: string; hours: number }[];
  heatmap: { weekday: number; hour: number; hours: number }[];
  heatmapMax: number;
  topRooms: {
    roomId: string;
    name: string;
    floor: string;
    hours: number;
    meetings: number;
  }[];
  dailyHours: { date: string; label: string; hours: number }[];
  averageMinutes: number;
  peakHour: { hour: number; label: string; hours: number };
  utilisationYear: number;
  busiestFloor: { label: string; hours: number } | null;
};
