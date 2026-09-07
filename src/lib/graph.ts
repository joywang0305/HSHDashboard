import { zonedDateTime } from "@/lib/time";
import type { Booking, Room } from "@/lib/types";
import { isHshSgbRoomName, sgbBand } from "@/lib/floor-plan";

type TokenPayload = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GraphRoom = {
  id?: string;
  displayName?: string;
  emailAddress?: string;
  capacity?: number;
  building?: string;
  floorLabel?: string;
  floorNumber?: number | string;
};

type GraphEvent = {
  id?: string;
  subject?: string | null;
  organizer?: { emailAddress?: { name?: string; address?: string } };
  start?: { dateTime?: string; timeZone?: string };
  end?: { dateTime?: string; timeZone?: string };
};

let cachedToken:
  | { value: string; expiresAt: number }
  | null = null;
let cachedRooms:
  | { at: number; rooms: Room[] }
  | null = null;

function credentials() {
  const tenant = process.env.MICROSOFT_GRAPH_TENANT_ID;
  const clientId = process.env.MICROSOFT_GRAPH_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_GRAPH_CLIENT_SECRET;
  if (!tenant || !clientId || !clientSecret) return null;
  return { tenant, clientId, clientSecret };
}

export function graphCredentialsPresent() {
  return Boolean(credentials());
}

async function accessToken() {
  const creds = credentials();
  if (!creds) throw new Error("Microsoft Graph is not configured.");
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }
  const response = await fetch(
    `https://login.microsoftonline.com/${creds.tenant}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: creds.clientId,
        client_secret: creds.clientSecret,
        grant_type: "client_credentials",
        scope: "https://graph.microsoft.com/.default",
      }),
      cache: "no-store",
    },
  );
  const payload = (await response.json()) as TokenPayload;
  if (!payload.access_token) {
    throw new Error(
      payload.error_description ??
        payload.error ??
        `Could not sign in to Outlook (${response.status}).`,
    );
  }
  console.info(`Outlook token acquired (${response.status})`);
  cachedToken = {
    value: payload.access_token,
    expiresAt: Date.now() + 50 * 60_000,
  };
  return payload.access_token;
}

async function graphGet<T>(
  path: string,
  extraHeaders: Record<string, string> = {},
): Promise<T> {
  const token = await accessToken();
  const response = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Prefer: 'outlook.timezone="Asia/Hong_Kong"',
      ...extraHeaders,
    },
    cache: "no-store",
  });
  const payload = (await response.json()) as T & {
    error?: { message?: string; code?: string } | string;
    error_description?: string;
  };
  if (!response.ok) {
    const graphError = payload.error;
    const message =
      (typeof graphError === "string" ? graphError : graphError?.message) ||
      (typeof graphError === "object" ? graphError?.code : "") ||
      payload.error_description ||
      `Graph ${response.status}`;
    throw new Error(`${message} (${response.status})`);
  }
  return payload as T;
}

async function graphCollection<T>(
  firstPath: string,
  extraHeaders: Record<string, string> = {},
): Promise<T[]> {
  const items: T[] = [];
  let path: string | null = firstPath;
  while (path) {
    const requestPath: string = path.startsWith("http")
      ? path.replace("https://graph.microsoft.com/v1.0", "")
      : path;
    const page: { value?: T[]; "@odata.nextLink"?: string } = await graphGet(
      requestPath,
      extraHeaders,
    );
    items.push(...(page.value ?? []));
    const nextLink = page["@odata.nextLink"];
    path = nextLink
      ? nextLink.replace("https://graph.microsoft.com/v1.0", "")
      : null;
  }
  return items;
}

function toRoom(place: GraphRoom): Room | null {
  const name = place.displayName?.trim();
  const email = place.emailAddress?.trim().toLowerCase();
  if (!name || !email) return null;
  if (!isHshSgbRoomName(name, `${place.floorLabel ?? ""} ${place.building ?? ""}`)) {
    return null;
  }
  return {
    id: email,
    name,
    email,
    capacity: Number(place.capacity) > 0 ? Number(place.capacity) : 4,
    floor: "SGB",
    equipment: [],
  };
}

export function cachedSgbRooms() {
  return cachedRooms?.rooms ?? [];
}

function toRoomFromUser(user: {
  displayName?: string;
  mail?: string;
  userPrincipalName?: string;
}): Room | null {
  const name = user.displayName?.trim();
  const email = (user.mail || user.userPrincipalName || "").trim().toLowerCase();
  if (!name || !email || !email.includes("@")) return null;
  if (!isHshSgbRoomName(name, email)) return null;
  return {
    id: email,
    name,
    email,
    capacity: 4,
    floor: "SGB",
    equipment: [],
  };
}

async function listGraphRooms(): Promise<GraphRoom[]> {
  try {
    const direct = await graphCollection<GraphRoom>(
      "/places/microsoft.graph.room?$top=999",
    );
    if (direct.length > 0) return direct;
  } catch (error) {
    console.error("Outlook places/room failed", error);
  }
  try {
    const lists = await graphCollection<{ id?: string }>(
      "/places/microsoft.graph.roomList?$top=200",
    );
    const nested = await Promise.all(
      lists
        .map((list) => list.id)
        .filter((id): id is string => Boolean(id))
        .map((id) =>
          graphCollection<GraphRoom>(
            `/places/${id}/microsoft.graph.roomlist/rooms`,
          ),
        ),
    );
    const rooms = nested.flat();
    if (rooms.length > 0) return rooms;
  } catch (error) {
    console.error("Outlook roomList failed", error);
  }
  const users = await graphCollection<{
    displayName?: string;
    mail?: string;
    userPrincipalName?: string;
  }>(
    `/users?$search="displayName:HSH"&$select=displayName,mail,userPrincipalName&$top=999`,
    { ConsistencyLevel: "eventual" },
  );
  return users
    .map((user) => toRoomFromUser(user))
    .filter((room): room is Room => Boolean(room))
    .map((room) => ({
      displayName: room.name,
      emailAddress: room.email,
      capacity: room.capacity,
    }));
}

export async function fetchSgbOutlookRooms(): Promise<Room[]> {
  if (cachedRooms && Date.now() - cachedRooms.at < 5 * 60_000) {
    return cachedRooms.rooms;
  }
  const places = await listGraphRooms();
  const rooms = places
    .map(toRoom)
    .filter((room): room is Room => Boolean(room))
    .sort((a, b) => {
      const band = (name: string) =>
        sgbBand(name) === "7F" ? 0 : sgbBand(name) === "8F" ? 1 : 2;
      const delta = band(a.name) - band(b.name);
      return delta !== 0 ? delta : a.name.localeCompare(b.name);
    });
  cachedRooms = { at: Date.now(), rooms };
  return rooms;
}

function graphDateToIso(value?: { dateTime?: string }) {
  const raw = value?.dateTime?.slice(0, 19);
  if (!raw || !raw.includes("T")) return new Date().toISOString();
  const [date, time] = raw.split("T");
  const [hour, minute] = time.split(":").map(Number);
  return zonedDateTime(date, hour, minute || 0).toISOString();
}

export async function fetchSgbOutlookBookings(
  rooms: Room[],
  date: string,
): Promise<Booking[]> {
  const start = zonedDateTime(date, 0, 0).toISOString();
  const end = zonedDateTime(date, 23, 59).toISOString();
  const pages = await Promise.all(
    rooms.map(async (room) => {
      try {
        const events = await graphCollection<GraphEvent>(
          `/users/${encodeURIComponent(room.email)}/calendarView?startDateTime=${encodeURIComponent(start)}&endDateTime=${encodeURIComponent(end)}&$select=id,subject,organizer,start,end&$top=80`,
        );
        return events.map((event) => ({
          id: event.id ?? `${room.id}-${event.start?.dateTime}`,
          roomId: room.id,
          title: event.subject?.trim() ? event.subject.trim() : "Busy",
          organizer:
            event.organizer?.emailAddress?.name?.trim() ||
            event.organizer?.emailAddress?.address ||
            "Outlook",
          start: graphDateToIso(event.start),
          end: graphDateToIso(event.end),
          source: "outlook" as const,
        }));
      } catch (error) {
        console.error(`Outlook calendar for ${room.email} failed`, error);
        return [];
      }
    }),
  );
  return pages.flat().sort((a, b) => a.start.localeCompare(b.start));
}

export function clearGraphCache() {
  cachedToken = null;
  cachedRooms = null;
}
