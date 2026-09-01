export const SITES = [
  "North Wharf",
  "Process Hall",
  "Cold Store",
  "Admin Annex",
  "Fleet Yard",
] as const;

export type Site = (typeof SITES)[number];

export const INCIDENT_CATEGORIES = [
  "injury",
  "near-miss",
  "property",
  "environment",
  "hygiene",
] as const;

export type IncidentCategory = (typeof INCIDENT_CATEGORIES)[number];

export const SEVERITIES = ["critical", "high", "medium", "low"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const INCIDENT_STATUSES = ["open", "investigating", "closed"] as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

export const INSPECTION_TYPES = [
  "hygiene",
  "ppe",
  "fire",
  "equipment",
  "housekeeping",
] as const;
export type InspectionType = (typeof INSPECTION_TYPES)[number];

export const INSPECTION_STATUSES = ["upcoming", "overdue", "complete"] as const;
export type InspectionStatus = (typeof INSPECTION_STATUSES)[number];

export const ACTION_STATUSES = ["open", "overdue", "done"] as const;
export type ActionStatus = (typeof ACTION_STATUSES)[number];

export type Incident = {
  id: string;
  title: string;
  site: Site;
  category: IncidentCategory;
  severity: Severity;
  status: IncidentStatus;
  reportedBy: string;
  reportedAt: string;
  description: string;
};

export type Inspection = {
  id: string;
  title: string;
  site: Site;
  type: InspectionType;
  scheduledFor: string;
  inspector: string;
  status: InspectionStatus;
  score?: number;
};

export type CorrectiveAction = {
  id: string;
  title: string;
  relatedTo: string;
  owner: string;
  due: string;
  status: ActionStatus;
  priority: Severity;
};

export type DashboardData = {
  incidents: Incident[];
  inspections: Inspection[];
  actions: CorrectiveAction[];
};

export const CATEGORY_LABELS: Record<IncidentCategory, string> = {
  injury: "Injury",
  "near-miss": "Near miss",
  property: "Property",
  environment: "Environment",
  hygiene: "Hygiene",
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  open: "Open",
  investigating: "Investigating",
  closed: "Closed",
};

export const INSPECTION_TYPE_LABELS: Record<InspectionType, string> = {
  hygiene: "Hygiene",
  ppe: "PPE",
  fire: "Fire",
  equipment: "Equipment",
  housekeeping: "Housekeeping",
};

export const INSPECTION_STATUS_LABELS: Record<InspectionStatus, string> = {
  upcoming: "Upcoming",
  overdue: "Overdue",
  complete: "Complete",
};

export const ACTION_STATUS_LABELS: Record<ActionStatus, string> = {
  open: "Open",
  overdue: "Overdue",
  done: "Done",
};
