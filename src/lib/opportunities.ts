export type Opportunity = {
  id: string;
  /** Job title — RCM list Title */
  title: string;
  /** Property / business unit — RCM Operation */
  operation: string;
  /** City or site — RCM Location */
  location: string;
  /** ISO date — PostStartDate */
  postStartDate: string;
  /** ISO date — PostEndDate */
  postEndDate: string;
  department?: string;
  /** Short overview shown in the detail dialog. */
  summary?: string;
  /** Bullet lines — role highlights. */
  responsibilities?: string[];
  /** Bullet lines — experience / qualifications. */
  requirements?: string[];
  /** How to apply or enquire. */
  howToApply?: string;
};

export type OpportunitiesBoard = {
  source: "mock" | "sharepoint";
  asOf: string;
  openings: Opportunity[];
};

/**
 * Mock feed shaped like PenterActive Lists/RCM
 * (Title, Operation, Location, PostStartDate, PostEndDate).
 * Detail fields stand in for richer RCM / careers content until Graph is wired.
 */
export const MOCK_OPPORTUNITIES_BOARD: OpportunitiesBoard = {
  source: "mock",
  asOf: "2026-09-22",
  openings: [
    {
      id: "rcm-1",
      title: "Guest Experience Manager",
      operation: "The Peninsula Hong Kong",
      location: "Hong Kong",
      department: "Rooms",
      postStartDate: "2026-09-01",
      postEndDate: "2026-10-31",
      summary:
        "Lead the guest journey from arrival to departure, coaching the front-of-house team to deliver Peninsula service standards.",
      responsibilities: [
        "Oversee lobby, concierge, and guest-relations operations on shift",
        "Resolve complex guest requests with calm, discreet service",
        "Partner with rooms and F&B to maintain seamless handovers",
      ],
      requirements: [
        "5+ years in luxury hotel guest services or rooms",
        "Fluent English; Cantonese or Mandarin an advantage",
        "Proven team leadership and coaching experience",
      ],
      howToApply: "Apply via MyHSH Hub Careers, or write to careers.hk@peninsula.com.",
    },
    {
      id: "rcm-2",
      title: "Sous Chef — Cantonese Kitchen",
      operation: "The Peninsula Shanghai",
      location: "Shanghai",
      department: "Culinary",
      postStartDate: "2026-08-15",
      postEndDate: "2026-10-15",
      summary:
        "Support the Executive Chef in delivering refined Cantonese cuisine for restaurant and banquet service.",
      responsibilities: [
        "Supervise section cooks and maintain mise en place standards",
        "Uphold food safety, costing, and Peninsula presentation",
        "Contribute to seasonal menu development",
      ],
      requirements: [
        "Strong Cantonese kitchen background in a five-star property",
        "Food hygiene certification current for mainland China",
        "Ability to lead under pressure during peak service",
      ],
      howToApply: "Submit your CV through the Group careers portal (RCM).",
    },
    {
      id: "rcm-3",
      title: "Finance Analyst",
      operation: "Group Head Office",
      location: "Hong Kong",
      department: "Group Finance",
      postStartDate: "2026-09-08",
      postEndDate: "2026-11-07",
      summary:
        "Support monthly reporting, forecasting, and analysis for hotels and commercial properties across the Group.",
      responsibilities: [
        "Prepare management packs and variance commentary",
        "Partner with property finance teams on forecasts",
        "Improve reporting models and data quality",
      ],
      requirements: [
        "Degree in accounting, finance, or related field",
        "Strong Excel; experience with ERP reporting preferred",
        "HKCPA / ACCA progress welcome",
      ],
      howToApply: "Apply via MyHSH Hub, referencing “Finance Analyst — HO”.",
    },
    {
      id: "rcm-4",
      title: "Spa Therapist",
      operation: "The Peninsula Paris",
      location: "Paris",
      department: "Spa",
      postStartDate: "2026-09-10",
      postEndDate: "2026-10-20",
      // No extended detail — card stays non-interactive until content exists.
    },
    {
      id: "rcm-5",
      title: "IT Support Specialist",
      operation: "The Peninsula Tokyo",
      location: "Tokyo",
      department: "Technology",
      postStartDate: "2026-08-20",
      postEndDate: "2026-10-31",
      summary:
        "Provide on-site and remote support for colleagues and guest-facing systems at The Peninsula Tokyo.",
      responsibilities: [
        "Triage tickets for workplace devices, network, and hotel systems",
        "Support AV and meeting-room technology for high-profile events",
        "Document fixes and escalate with Group IT as needed",
      ],
      requirements: [
        "Experience supporting Windows and Microsoft 365 in a hospitality setting",
        "Japanese and English communication skills",
        "Willingness to work rotating shifts including weekends",
      ],
      howToApply: "Apply through MyHSH Hub Careers.",
    },
    {
      id: "rcm-6",
      title: "Sales Manager — Corporate",
      operation: "The Peninsula New York",
      location: "New York",
      department: "Sales",
      postStartDate: "2026-09-05",
      postEndDate: "2026-11-30",
      summary:
        "Grow corporate transient and meeting business while representing Peninsula hospitality in the New York market.",
      responsibilities: [
        "Manage a corporate account portfolio and hit revenue targets",
        "Conduct client visits, RFPs, and site inspections",
        "Coordinate with revenue and events on proposals",
      ],
      requirements: [
        "Luxury hotel or corporate sales experience in NYC",
        "Strong negotiation and relationship skills",
        "Familiarity with Delphi or similar CRM preferred",
      ],
      howToApply: "Email careers.ny@peninsula.com with “Corporate Sales Manager” in the subject.",
    },
    {
      id: "rcm-7",
      title: "Housekeeping Supervisor",
      operation: "The Peninsula Bangkok",
      location: "Bangkok",
      department: "Housekeeping",
      postStartDate: "2026-09-12",
      postEndDate: "2026-10-25",
    },
    {
      id: "rcm-8",
      title: "People & Culture Officer",
      operation: "The Peninsula London",
      location: "London",
      department: "People & Culture",
      postStartDate: "2026-09-01",
      postEndDate: "2026-10-31",
      summary:
        "Support recruitment, onboarding, and colleague engagement for The Peninsula London.",
      responsibilities: [
        "Coordinate hiring workflows and new-joiner induction",
        "Maintain accurate colleague records and policy guidance",
        "Help deliver recognition and wellbeing programmes",
      ],
      requirements: [
        "HR generalist experience in hospitality or luxury retail",
        "Right to work in the UK",
        "CIPD qualification or progress preferred",
      ],
      howToApply: "Apply via MyHSH Hub Careers.",
    },
  ],
};

export function formatOpportunityDate(iso: string) {
  const date = new Date(`${iso}T12:00:00`);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/** Openings whose post window includes today (Asia/Hong_Kong calendar day). */
export function currentOpenings(
  openings: Opportunity[],
  asOf = new Date(),
): Opportunity[] {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(asOf);
  return openings.filter(
    (item) => item.postStartDate <= today && item.postEndDate >= today,
  );
}

export function hasOpportunityDetails(opening: Opportunity) {
  return Boolean(
    opening.summary ||
      (opening.responsibilities && opening.responsibilities.length > 0) ||
      (opening.requirements && opening.requirements.length > 0) ||
      opening.howToApply,
  );
}
