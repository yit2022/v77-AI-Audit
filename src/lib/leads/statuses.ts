export const LEAD_STATUSES = ["new", "contacted", "qualified", "won", "lost", "archived"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];
