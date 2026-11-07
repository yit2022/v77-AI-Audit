"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { PageHeader, RiskBadge } from "@/components/ui";
import { EU_INDUSTRY_PLAYBOOKS, getEuIndustryPlaybook } from "@/lib/eu-ai-act/industries";

type Question = {
  id: string;
  section: string;
  prompt: string;
  help: string;
};

type ClassificationResponseResult = {
  tier: string;
  reasons: string[];
  gpai: boolean;
  gpaiSystemicRisk?: boolean;
  art6_3ExemptionClaimed?: boolean;
  art25ProviderEscalation?: boolean;
  obligationsSummary?: string[];
};

const ALL_ARCHETYPES = EU_INDUSTRY_PLAYBOOKS.flatMap((pb) =>
  pb.archetypes.map((arch) => ({
    ...arch,
    industryId: pb.id,
    industryName: pb.name,
  })),
);

const SECTION_META: Array<{ id: string; title: string; subtitle: string }> = [
  {
    id: "prohibited",
    title: "1. Prohibited AI Practices (Article 5(1)(a)–(h))",
    subtitle: "Unacceptable risk practices prohibited in the Union since 2 February 2025.",
  },
  {
    id: "high_risk",
    title: "2. High-Risk AI Systems (Article 6, Annex I & Annex III)",
    subtitle: "Regulated product safety components (Annex I) and high-impact standalone use cases (Annex III).",
  },
  {
    id: "context",
    title: "3. Article 6(3) Derogation & Article 25 Value-Chain Role Escalation",
    subtitle:
      "Narrow procedural/preparatory exemption checks (with profiling override) and substantial modification / rebranding provider escalation.",
  },
  {
    id: "limited",
    title: "4. Transparency & Limited Risk Obligations (Article 50)",
    subtitle: "Direct human-AI interaction disclosure and synthetic audio/image/video/text marking (C2PA / watermarking).",
  },
  {
    id: "gpai",
    title: "5. General-Purpose AI Models (Chapter V, Articles 51–55)",
    subtitle: "GPAI technical documentation, copyright summary, and systemic-risk (10^25 FLOPs) obligations.",
  },
];

export default function ClassificationPage() {
  const { systemId } = useParams<{ systemId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedArchetypeId, setSelectedArchetypeId] = useState<string>(ALL_ARCHETYPES[0]?.id || "");
  const [result, setResult] = useState<ClassificationResponseResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function applyArchetypeAnswers(archId: string, qList: Question[]) {
    const arch = ALL_ARCHETYPES.find((a) => a.id === archId) || ALL_ARCHETYPES[0];
    if (!arch) return;
    setSelectedArchetypeId(arch.id);
    const yesSet = new Set(arch.classifierYesIds);
    const next: Record<string, string> = {};
    for (const q of qList) {
      next[q.id] = yesSet.has(q.id) ? "yes" : "no";
    }
    setAnswers(next);
  }

  useEffect(() => {
    Promise.all([
      fetch("/api/classification").then((r) => r.json()),
      fetch("/api/systems")
        .then((r) => r.json())
        .catch(() => ({ systems: [] })),
    ]).then(([classData, sysData]) => {
      const qList: Question[] = classData.questions || [];
      setQuestions(qList);

      const urlArch = searchParams.get("archetype");
      if (urlArch && ALL_ARCHETYPES.some((a) => a.id === urlArch)) {
        applyArchetypeAnswers(urlArch, qList);
        return;
      }

      const matchedSys = (sysData.systems || []).find((s: { id: string; domain?: string }) => s.id === systemId);
      if (matchedSys?.domain) {
        const pb = getEuIndustryPlaybook(matchedSys.domain);
        if (pb.archetypes[0]) {
          applyArchetypeAnswers(pb.archetypes[0].id, qList);
          return;
        }
      }

      applyArchetypeAnswers(ALL_ARCHETYPES[0].id, qList);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/classification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemId, answers, createAssessment: true }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Classification failed");
      return;
    }
    const data = await res.json();
    setResult(data.result);
    if (data.assessmentId) {
      setTimeout(() => router.push(`/systems/${systemId}`), 1200);
    }
  }

  const activeYesCount = Object.values(answers).filter((v) => v === "yes").length;

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="Step 2: EU AI Act Statutory Risk Classifier (AI Pre-Populated)"
        subtitle="Zero guesswork: Select the system's European regulatory blueprint below to auto-populate all 25 statutory questions (Art. 5, Annex I/III, Art. 6(3), Art. 25, Art. 50 & Chapter V GPAI), then click Save & Classify."
      />

      {/* AI Statutory Blueprint Pre-Population Bar */}
      <div className="card border-sky-200 bg-gradient-to-br from-sky-50/80 via-white to-indigo-50/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="inline-flex items-center rounded-full bg-[#0F2A4A] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
              Zero-Guesswork Statutory Pre-Fill
            </span>
            <h2 className="mt-1 text-sm font-semibold text-[#0F2A4A]">
              Select AI System Blueprint to Pre-Populate All 25 EU AI Act Questions
            </h2>
            <p className="text-xs text-slate-600">
              All 25 statutory questions are automatically answered based on your selected European use case ({activeYesCount} statutory triggers marked &ldquo;Yes&rdquo;).
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => submit(e as unknown as React.FormEvent)}
            disabled={loading || questions.length === 0}
            className="btn btn-primary"
          >
            {loading ? "Classifying…" : "1-Click Save Classification & Create Assessment →"}
          </button>
        </div>

        <div className="mt-3">
          <select
            className="select border-sky-300 bg-white font-medium text-slate-900"
            value={selectedArchetypeId}
            onChange={(e) => applyArchetypeAnswers(e.target.value, questions)}
          >
            {EU_INDUSTRY_PLAYBOOKS.map((pb) => (
              <optgroup key={pb.id} label={pb.name}>
                {pb.archetypes.map((arch) => (
                  <option key={arch.id} value={arch.id}>
                    {arch.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-6">
        {SECTION_META.map((section) => (
          <div key={section.id} className="card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#0F2A4A]">
              {section.title}
            </h2>
            <p className="mb-4 mt-1 text-xs text-slate-500">{section.subtitle}</p>
            <div className="space-y-4">
              {questions
                .filter((q) => q.section === section.id)
                .map((q) => {
                  const isYes = answers[q.id] === "yes";
                  return (
                    <div
                      key={q.id}
                      className={`rounded-xl border p-3.5 transition ${
                        isYes ? "border-sky-300 bg-sky-50/60" : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="max-w-2xl">
                          <p className="text-sm font-medium text-slate-900">{q.prompt}</p>
                          <p className="mt-1 text-xs text-slate-500">{q.help}</p>
                        </div>
                        <select
                          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                            isYes
                              ? "border-sky-400 bg-[#0F2A4A] text-white"
                              : "border-slate-300 bg-slate-50 text-slate-700"
                          }`}
                          value={answers[q.id] || "no"}
                          onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                        >
                          <option value="yes">Yes — Statutory Trigger Applies</option>
                          <option value="no">No — Does Not Apply</option>
                          <option value="na">N/A — Not Applicable</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {result ? (
          <div className="card space-y-2 border-emerald-300 bg-emerald-50/50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <RiskBadge tier={result.tier} />
              {result.gpai ? <span className="badge badge-limited">GPAI (Art. 53)</span> : null}
              {result.gpaiSystemicRisk ? <span className="badge badge-high">Systemic Risk GPAI (Art. 55)</span> : null}
              {result.art6_3ExemptionClaimed ? <span className="badge badge-minimal">Art. 6(3) Derogation Applied</span> : null}
              {result.art25ProviderEscalation ? <span className="badge badge-high">Art. 25 Escalated to Provider</span> : null}
            </div>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
              {result.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Classifying…" : "Save Classification & Open 360° Project Command Center →"}
        </button>
      </form>
    </div>
  );
}
