export type Art73Category = "art_73_2" | "art_73_3" | "art_73_4";

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
    label: "Art. 73(2) — Standard serious incident / fundamental rights harm (15-day window)",
    deadlineDays: 15,
    description: "Report immediately after establishing causal link, and no later than 15 days after becoming aware.",
  },
  {
    id: "art_73_3",
    articleRef: "Art. 73(3)",
    label: "Art. 73(3) — Widespread infringement or critical infrastructure disruption (2-day window)",
    deadlineDays: 2,
    description: "Report immediately, and no later than 2 days after becoming aware of the serious incident.",
  },
  {
    id: "art_73_4",
    articleRef: "Art. 73(4)",
    label: "Art. 73(4) — Death of a person (10-day window)",
    deadlineDays: 10,
    description: "Report immediately after establishing or suspecting causal link, and no later than 10 days after becoming aware.",
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
