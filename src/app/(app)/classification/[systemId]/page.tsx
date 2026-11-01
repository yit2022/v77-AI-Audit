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

export default function ClassificationPage() {
  const { systemId } = useParams<{ systemId: string }>();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ tier: string; reasons: string[]; gpai: boolean } | null>(null);
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
      setTimeout(() => router.push(`/assessments/${data.assessmentId}`), 1200);
    }
  }

  const sections = ["prohibited", "high_risk", "limited", "gpai"];

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="EU AI Act risk classification"
        subtitle="Answer the questionnaire. Prohibited overrides high-risk; high-risk overrides limited; otherwise minimal (GPAI may apply in parallel)."
      />
      <form onSubmit={submit} className="space-y-6">
        {sections.map((section) => (
          <div key={section} className="card p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-700">
              {section.replace("_", " ")}
            </h2>
            <div className="space-y-5">
              {questions
                .filter((q) => q.section === section)
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
          <div className="card flex items-center gap-3 p-4">
            <RiskBadge tier={result.tier} />
            <span className="text-sm text-slate-600">
              {result.reasons[0]} {result.gpai ? "(GPAI flagged)" : ""}
            </span>
          </div>
        ) : null}
        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Classifying…" : "Classify & create assessment"}
        </button>
      </form>
    </div>
  );
}
