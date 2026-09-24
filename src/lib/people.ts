export type PeoplePerson = {
  id: string;
  name: string;
  title: string;
  division: string;
  capital: string;
  notes?: string;
  /** ISO date — join date for new joiners, anniversary date for long service. */
  date: string;
  /** Years of service (long service only). */
  years?: number;
  /** Photo URL from SharePoint attachment when wired; omit for monogram. */
  photoUrl?: string | null;
  hidden?: boolean;
};

export type PeopleBoard = {
  source: "mock" | "sharepoint";
  asOf: string;
  newJoiners: PeoplePerson[];
  longService: PeoplePerson[];
};

/**
 * Mock feed shaped like PenterActive lists:
 * - New joiners → Lists/People (Name, Join Date, Capital, Division, Attachments)
 * - Long service → Lists/Service Anniversaries (schema guessed until Graph read works)
 */
export const MOCK_PEOPLE_BOARD: PeopleBoard = {
  source: "mock",
  asOf: "2026-09-22",
  newJoiners: [
    {
      id: "nj-1",
      name: "Aisha Rahman",
      title: "Guest Experience Manager",
      division: "Hotels",
      capital: "Hong Kong",
      date: "2026-09-01",
      notes: "Joined The Peninsula Hong Kong front office.",
    },
    {
      id: "nj-2",
      name: "Marcus Chen",
      title: "Finance Analyst",
      division: "Group Finance",
      capital: "Hong Kong",
      date: "2026-08-18",
    },
    {
      id: "nj-3",
      name: "Elena Rossi",
      title: "Spa Therapist",
      division: "Hotels",
      capital: "Paris",
      date: "2026-08-04",
    },
    {
      id: "nj-4",
      name: "Kenji Watanabe",
      title: "Culinary Supervisor",
      division: "Hotels",
      capital: "Tokyo",
      date: "2026-07-21",
    },
    {
      id: "nj-5",
      name: "Sofia Alvarez",
      title: "People & Culture Officer",
      division: "People & Culture",
      capital: "New York",
      date: "2026-07-07",
    },
    {
      id: "nj-6",
      name: "Wei Lim",
      title: "Digital Marketing Executive",
      division: "Marketing",
      capital: "Shanghai",
      date: "2026-06-16",
    },
  ],
  longService: [
    {
      id: "ls-1",
      name: "Patricia Wong",
      title: "Director of Rooms",
      division: "Hotels",
      capital: "Hong Kong",
      date: "2001-09-15",
      years: 25,
    },
    {
      id: "ls-2",
      name: "James Okafor",
      title: "Chief Concierge",
      division: "Hotels",
      capital: "London",
      date: "2006-04-02",
      years: 20,
    },
    {
      id: "ls-3",
      name: "Mei Ling Tan",
      title: "Housekeeping Manager",
      division: "Hotels",
      capital: "Bangkok",
      date: "2011-11-20",
      years: 15,
    },
    {
      id: "ls-4",
      name: "David Park",
      title: "IT Infrastructure Lead",
      division: "Technology",
      capital: "Hong Kong",
      date: "2016-03-08",
      years: 10,
    },
    {
      id: "ls-5",
      name: "Claire Dubois",
      title: "Pastry Chef",
      division: "Hotels",
      capital: "Paris",
      date: "2016-09-01",
      years: 10,
    },
    {
      id: "ls-6",
      name: "Hiroshi Sato",
      title: "Engineering Supervisor",
      division: "Hotels",
      capital: "Tokyo",
      date: "2021-05-12",
      years: 5,
    },
  ],
};

export function formatPeopleDate(iso: string) {
  const date = new Date(`${iso}T12:00:00`);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}
