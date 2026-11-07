export type Art73Category =
  | "art_73_2"
  | "art_73_3"
  | "art_73_4"
  | "us_co_sb205"
  | "uk_ico_72h"
  | "au_oaic_apra"
  | "nz_opc_72h";

export const ART_73_CATEGORIES: Array<{
  id: Art73Category;
  articleRef: string;
  label: string;
  deadlineDays: number;
  description: string;
}> = [
  {
    id: "art_73_2",
    articleRef: "Art. 73(2)",
    label: "🇪🇺 EU AI Act Art. 73(2) — Standard serious incident / fundamental rights harm (15-day window)",
    deadlineDays: 15,
    description: "Report immediately after establishing causal link, and no later than 15 days after becoming aware.",
  },
  {
    id: "art_73_3",
    articleRef: "Art. 73(3)",
    label: "🇪🇺 EU AI Act Art. 73(3) — Widespread infringement or critical infrastructure disruption (2-day window)",
    deadlineDays: 2,
    description: "Report immediately, and no later than 2 days after becoming aware of the serious incident.",
  },
  {
    id: "art_73_4",
    articleRef: "Art. 73(4)",
    label: "🇪🇺 EU AI Act Art. 73(4) — Death of a person (10-day window)",
    deadlineDays: 10,
    description: "Report immediately after establishing or suspecting causal link, and no later than 10 days after becoming aware.",
  },
  {
    id: "us_co_sb205",
    articleRef: "US CO SB 24-205 § 6-1-1703(7)",
    label: "🇺🇸 US Colorado SB 24-205 — Algorithmic discrimination discovery to Attorney General (90-day window)",
    deadlineDays: 90,
    description: "Mandatory disclosure to the Colorado Attorney General within 90 days after discovering algorithmic discrimination.",
  },
  {
    id: "uk_ico_72h",
    articleRef: "UK GDPR Art. 33 / ICO",
    label: "🇬🇧 UK ICO / FCA — AI personal-data breach or serious operational incident (3-day / 72h window)",
    deadlineDays: 3,
    description: "Notify the UK Information Commissioner's Office (ICO) within 72 hours (3 days) where AI incident affects personal data or rights.",
  },
  {
    id: "au_oaic_apra",
    articleRef: "AU Guardrail 9 / APRA CPS 234",
    label: "🇦🇺 Australia OAIC / APRA CPS 234 — Material AI security or privacy incident (3-day / 72h window)",
    deadlineDays: 3,
    description: "Notify APRA within 72 hours for material information security incidents (CPS 234) and OAIC under the Notifiable Data Breaches scheme.",
  },
  {
    id: "nz_opc_72h",
    articleRef: "NZ Privacy Act s.114 (OPC)",
    label: "🇳🇿 New Zealand OPC NotifyUs — Notifiable AI privacy breach causing serious harm (3-day / 72h window)",
    deadlineDays: 3,
    description: "Notify the NZ Office of the Privacy Commissioner via NotifyUs (72-hour target) when an AI incident poses serious harm under s.114.",
  },
];

export function computeArt73Deadline(opts: {
  euArticleRef?: string | null;
  discoveredAt?: string | null;
  createdAt?: Date | string | number | null;
}): {
  articleRef: string;
  deadlineDays: number;
  deadlineIso: string;
  overdue: boolean;
} {
  const ref = (opts.euArticleRef || "Art. 73(2)").trim();
  const matched =
    ART_73_CATEGORIES.find((c) => ref.includes(c.articleRef) || ref === c.id) ?? ART_73_CATEGORIES[0];

  let baseDate = new Date();
  if (opts.discoveredAt && !Number.isNaN(Date.parse(opts.discoveredAt))) {
    baseDate = new Date(opts.discoveredAt);
  } else if (opts.createdAt) {
    const parsed = new Date(opts.createdAt);
    if (!Number.isNaN(parsed.getTime())) baseDate = parsed;
  }

  const deadlineMs = baseDate.getTime() + matched.deadlineDays * 24 * 60 * 60 * 1000;
  const deadlineDate = new Date(deadlineMs);
  return {
    articleRef: matched.articleRef,
    deadlineDays: matched.deadlineDays,
    deadlineIso: deadlineDate.toISOString().slice(0, 10),
    overdue: Date.now() > deadlineMs,
  };
}

export function renderArt73AuthorityReport(incident: {
  id: string;
  title: string;
  severity: string;
  status: string;
  seriousIncident: boolean;
  euArticleRef?: string;
  discoveredAt?: string;
  authorityNotified?: boolean;
  createdAt?: string;
  systemName?: string;
}): string {
  const deadline = computeArt73Deadline({
    euArticleRef: incident.euArticleRef,
    discoveredAt: incident.discoveredAt,
    createdAt: incident.createdAt,
  });
  return [
    `# EU AI Act Article 73 — Serious Incident Market Surveillance Notification Dossier`,
    "",
    `- **Incident ID:** ${incident.id}`,
    `- **Title:** ${incident.title}`,
    `- **Linked AI System:** ${incident.systemName || "Workspace-level / Unlinked"}`,
    `- **Statutory Basis:** Regulation (EU) 2024/1689 ${deadline.articleRef}`,
    `- **Reporting Window:** ${deadline.deadlineDays} calendar days from awareness`,
    `- **Discovered Date:** ${incident.discoveredAt || incident.createdAt || new Date().toISOString().slice(0, 10)}`,
    `- **Statutory Notification Deadline:** ${deadline.deadlineIso}${deadline.overdue && !incident.authorityNotified ? " (OVERDUE)" : ""}`,
    `- **Authority Notification Status:** ${incident.authorityNotified ? "Notified" : "Pending Notification"}`,
    `- **Severity / Status:** ${incident.severity.toUpperCase()} · ${incident.status}`,
    "",
    `## 1. Nature of the Serious Incident (Art. 3(49) & ${deadline.articleRef})`,
    `This dossier documents a serious incident or malfunctioning of an AI system under Article 73 of the EU AI Act for submission to the competent national Market Surveillance Authority.`,
    "",
    `## 2. Immediate Containment, Root-Cause Investigation & Risk Mitigation (Art. 73(6))`,
    `- Preserve immutable inference logs and SHA-256 evidence records (Art. 12 & Art. 19) without altering the AI system in a manner that compromises root-cause investigation.`,
    `- Perform causal link verification between the AI system output and the reported harm.`,
    `- Coordinate corrective actions with the Provider / Deployer under Art. 20 and Art. 26(5).`,
    "",
    `## 3. Sign-Off Block`,
    `- **Prepared via:** V77 Trust (Vertex77 sp. z o.o.)`,
    `- **Exported At:** ${new Date().toISOString()}`,
    "",
  ].join("\n");
}
