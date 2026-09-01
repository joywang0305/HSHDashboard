import type { Booking, HubStory, Room, SharePointItem } from "@/lib/types";
import { todayInZone } from "@/lib/time";

function at(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

export function seedRooms(): Room[] {
  return [
    {
      id: "boardroom-a",
      name: "Boardroom A",
      email: "boardroom.a@hsh.example",
      capacity: 12,
      floor: "Level 3",
      equipment: ["Teams Room", "Whiteboard"],
      image: "/heritage/room-park.jpg",
    },
    {
      id: "collaboration-2",
      name: "Collaboration 2",
      email: "collab.2@hsh.example",
      capacity: 6,
      floor: "Level 2",
      equipment: ["TV", "HDMI"],
      image: "/heritage/room-suite.jpg",
    },
    {
      id: "hub-studio",
      name: "HSH Hub Studio",
      email: "hub.studio@hsh.example",
      capacity: 20,
      floor: "Ground",
      equipment: ["Projector", "Mic", "Teams Room"],
      image: "/heritage/room-dusk.jpg",
    },
    {
      id: "quiet-room",
      name: "Quiet Room",
      email: "quiet.room@hsh.example",
      capacity: 4,
      floor: "Level 2",
      equipment: ["Phone"],
      image: "/heritage/room-exec.jpg",
    },
  ];
}

export function seedBookings(date = todayInZone()): Booking[] {
  return [
    {
      id: "evt-1001",
      roomId: "boardroom-a",
      title: "Weekly ops stand-up",
      organizer: "Maya Chen",
      start: at(date, "08:30"),
      end: at(date, "09:15"),
      source: "outlook",
    },
    {
      id: "evt-1002",
      roomId: "boardroom-a",
      title: "Vendor review — facilities",
      organizer: "Elena Voss",
      start: at(date, "11:00"),
      end: at(date, "12:30"),
      source: "outlook",
    },
    {
      id: "evt-1003",
      roomId: "collaboration-2",
      title: "HSH Hub content planning",
      organizer: "Priya Nair",
      start: at(date, "09:00"),
      end: at(date, "10:00"),
      source: "outlook",
    },
    {
      id: "evt-1004",
      roomId: "hub-studio",
      title: "All-hands rehearsal",
      organizer: "Owen Blake",
      start: at(date, "14:00"),
      end: at(date, "16:00"),
      source: "outlook",
    },
    {
      id: "evt-1005",
      roomId: "quiet-room",
      title: "1:1 coaching",
      organizer: "Sam Okonkwo",
      start: at(date, "10:30"),
      end: at(date, "11:00"),
      source: "outlook",
    },
  ];
}

export function seedHub(): HubStory[] {
  return [
    {
      id: "hub-1",
      title: "Site induction refresh starts Monday",
      summary:
        "All contractors on North Wharf need the updated HSH Hub induction before signing in next week.",
      publishedAt: new Date().toISOString(),
      author: "HSH Hub",
      href: "https://hub.hsh.example/induction",
      image: "/heritage/stairs.jpg",
    },
    {
      id: "hub-2",
      title: "Cafeteria hours change this Thursday",
      summary:
        "Ground-floor servery closes at 14:30 for a kitchen deep clean. Hub Studio bookings are unaffected.",
      publishedAt: new Date(Date.now() - 3_600_000).toISOString(),
      author: "Workplace",
      href: "https://hub.hsh.example/cafeteria",
      image: "/heritage/arcade.jpg",
    },
    {
      id: "hub-3",
      title: "New Teams Room in Boardroom A",
      summary:
        "Tap to join is live. Book the room as usual from this board or from Outlook.",
      publishedAt: new Date(Date.now() - 86_400_000).toISOString(),
      author: "IT",
      href: "https://hub.hsh.example/teams-rooms",
      image: "/heritage/guestroom.jpg",
    },
  ];
}

export function seedSharePoint(): SharePointItem[] {
  return [
    {
      id: "sp-1",
      name: "HSH visitor protocol.docx",
      library: "Workplace / Policies",
      modifiedAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
      modifiedBy: "Elena Voss",
      href: "https://hsh.sharepoint.example/policies/visitor",
      kind: "document",
    },
    {
      id: "sp-2",
      name: "Room kit checklist",
      library: "Facilities / Lists",
      modifiedAt: new Date(Date.now() - 4 * 86_400_000).toISOString(),
      modifiedBy: "Owen Blake",
      href: "https://hsh.sharepoint.example/lists/room-kit",
      kind: "list",
    },
    {
      id: "sp-3",
      name: "September site notice",
      library: "Communication site",
      modifiedAt: new Date(Date.now() - 6 * 3_600_000).toISOString(),
      modifiedBy: "Priya Nair",
      href: "https://hsh.sharepoint.example/sitepages/september",
      kind: "page",
    },
    {
      id: "sp-4",
      name: "Floor 2 evacuation map.pdf",
      library: "H&S / Documents",
      modifiedAt: new Date(Date.now() - 12 * 86_400_000).toISOString(),
      modifiedBy: "Maya Chen",
      href: "https://hsh.sharepoint.example/hs/evac-l2",
      kind: "document",
    },
  ];
}
