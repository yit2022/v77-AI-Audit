"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader, RiskBadge } from "@/components/ui";

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
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ClassificationResponseResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/classification")
      .then((r) => r.json())
      .then((d) => {
        setQuestions(d.questions || []);
        const init: Record<string, string> = {};
        for (const q of d.questions || []) init[q.id] = "no";
        setAnswers(init);
      });
  }, []);

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
      setTimeout(() => router.push(`/assessments/${data.assessmentId}`), 1600);
    }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="EU AI Act risk classification"
        subtitle="Complete statutory questionnaire covering Art. 5(1)(a–h) prohibitions, Annex I/III high-risk triggers, Art. 6(3) exemptions, Art. 25 provider role escalation, Art. 50 transparency, and Chapter V GPAI."
      />
      <form onSubmit={submit} className="space-y-6">
        {SECTION_META.map((section) => (
          <div key={section.id} className="card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#0F2A4A]">
              {section.title}
            </h2>
            <p className="mb-4 mt-1 text-xs text-slate-500">{section.subtitle}</p>
            <div className="space-y-5">
              {questions
                .filter((q) => q.section === section.id)
                .map((q) => (
                  <div key={q.id}>
                    <p className="text-sm font-medium text-slate-800">{q.prompt}</p>
                    <p className="mt-1 text-xs text-slate-500">{q.help}</p>
                    <div className="mt-2 flex gap-4 text-sm">
                      {["yes", "no", "na"].map((v) => (
                        <label key={v} className="flex items-center gap-1.5 capitalize">
                          <input
                            type="radio"
                            name={q.id}
                            checked={answers[q.id] === v}
                            onChange={() => setAnswers((a) => ({ ...a, [q.id]: v }))}
                          />
                          {v === "na" ? "N/A" : v}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {result ? (
          <div className="card space-y-2 p-4">
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
          {loading ? "Classifying…" : "Classify & create assessment"}
        </button>
      </form>
    </div>
  );
}
