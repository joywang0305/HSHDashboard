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
