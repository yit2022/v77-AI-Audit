"use client";

import { useEffect, useState } from "react";

type Assessment = { id: string; name: string; status: string; systemName: string };
type Comment = { id: string; body: string; authorName: string; createdAt: string };
type Signoff = { opinion: string; summary: string; signedAt: string } | null;

export function AuditorClient({
  assessments,
  canSign,
}: {
  assessments: Assessment[];
  canSign: boolean;
}) {
  const [assessmentId, setAssessmentId] = useState(assessments[0]?.id ?? "");
  const [comments, setComments] = useState<Comment[]>([]);
  const [signoff, setSignoff] = useState<Signoff>(null);
  const [body, setBody] = useState("");
  const [opinion, setOpinion] = useState("pass_with_findings");
  const [summary, setSummary] = useState("");
  const [msg, setMsg] = useState("");

  async function load(id: string) {
    if (!id) return;
    const res = await fetch(`/api/auditor?assessmentId=${id}`);
    const data = await res.json();
    setComments(data.comments || []);
    setSignoff(data.signoff);
  }

  useEffect(() => {
    load(assessmentId);
  }, [assessmentId]);

  async function addComment() {
    if (!body.trim()) return;
    await fetch("/api/auditor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assessmentId, body }),
    });
    setBody("");
    setMsg("Comment added");
    load(assessmentId);
  }

  async function doSignoff() {
    const res = await fetch("/api/auditor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "signoff", assessmentId, opinion, summary }),
    });
    if (!res.ok) {
      setMsg("Sign-off failed");
      return;
    }
    setMsg("Signed off");
    load(assessmentId);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="card space-y-3 p-5 lg:col-span-1">
        <label className="text-xs font-semibold text-slate-600">Assessment</label>
        <select
          className="select"
          value={assessmentId}
          onChange={(e) => setAssessmentId(e.target.value)}
        >
          {assessments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.systemName})
            </option>
          ))}
        </select>
        {signoff ? (
          <div className="rounded-lg bg-teal-50 p-3 text-sm text-teal-900">
            <div className="font-semibold capitalize">
              Opinion: {signoff.opinion.replaceAll("_", " ")}
            </div>
            <p className="mt-1 text-teal-800">{signoff.summary}</p>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No sign-off yet.</p>
        )}
        {canSign ? (
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <select className="select" value={opinion} onChange={(e) => setOpinion(e.target.value)}>
              <option value="pass">Pass</option>
              <option value="pass_with_findings">Pass with findings</option>
              <option value="fail">Fail</option>
            </select>
            <textarea
              className="textarea"
              placeholder="Sign-off summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
            <button className="btn btn-primary w-full" onClick={doSignoff}>
              Record sign-off
            </button>
          </div>
        ) : null}
        {msg ? <p className="text-xs text-slate-500">{msg}</p> : null}
      </div>
      <div className="card p-5 lg:col-span-2">
        <h2 className="text-sm font-semibold text-slate-800">Comments</h2>
        <div className="mt-3 space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="rounded-lg bg-slate-50 p-3 text-sm">
              <div className="text-xs text-slate-500">
                {c.authorName} · {c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}
              </div>
              <p className="mt-1 text-slate-800">{c.body}</p>
            </div>
          ))}
          {comments.length === 0 ? (
            <p className="text-sm text-slate-500">No comments yet.</p>
          ) : null}
        </div>
        <div className="mt-4 flex gap-2">
          <textarea
            className="textarea"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add an auditor comment…"
          />
        </div>
        <button className="btn btn-secondary mt-2" onClick={addComment}>
          Post comment
        </button>
      </div>
    </div>
  );
}
