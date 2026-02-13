"use client";

import { Lang, withLang } from "@/lib/i18n";
import Link from "next/link";
import { FormEvent, useState } from "react";

type Result = {
  score: number;
  strengths: string[];
  improvements: string[];
  roadmap: string[];
};

export function LaunchReadinessCheck({ lang }: { lang: Lang }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (input.trim().length < 20) {
      setError(lang === "ms" ? "Sila beri sedikit lebih detail untuk semakan." : "Please provide a bit more detail for the check.");
      return;
    }

    setLoading(true);
    setError("");
    const response = await fetch("/api/ai/assist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "launch_readiness", payload: { input } })
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload) {
      setError(payload?.error || (lang === "ms" ? "Semakan AI gagal." : "AI check failed."));
      setLoading(false);
      return;
    }
    setResult(payload);
    setLoading(false);
  }

  return (
    <section className="space-y-4 rounded-2xl border border-brand-500/30 bg-slate-900/70 p-5">
      <div>
        <p className="text-xs uppercase tracking-wide text-brand-300">AI Launch Readiness Check</p>
        <h2 className="text-2xl font-bold text-slate-100">{lang === "ms" ? "Semakan Kesediaan Launch AI" : "AI Launch Readiness Check"}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          rows={4}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={
            lang === "ms"
              ? "Terangkan pelan launch anda: genre, lagu, link, konten promosi, jadual..."
              : "Describe your launch plan: genre, release links, promo content, posting schedule..."
          }
          className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-200"
        />
        <button className="glow-cta rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-slate-950" disabled={loading}>
          {loading ? (lang === "ms" ? "AI sedang semak..." : "AI checking...") : lang === "ms" ? "Jana readiness score" : "Generate readiness score"}
        </button>
      </form>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      {result ? (
        <div className="space-y-3 rounded-xl border border-slate-700 bg-slate-950/60 p-4">
          <p className="text-sm text-slate-200">
            <span className="font-semibold text-brand-300">Readiness Score:</span> {result.score}/100
          </p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-400 to-emerald-300 transition-all"
              style={{ width: `${result.score}%` }}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-200">
                {lang === "ms" ? "Kekuatan" : "Strengths"}
              </p>
              <ul className="mt-2 space-y-1 text-sm text-slate-300">
                {result.strengths.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-200">
                {lang === "ms" ? "Penambahbaikan" : "Improvements"}
              </p>
              <ul className="mt-2 space-y-1 text-sm text-slate-300">
                {result.improvements.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-200">
                {lang === "ms" ? "Roadmap" : "Roadmap"}
              </p>
              <ul className="mt-2 space-y-1 text-sm text-slate-300">
                {result.roadmap.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
          <Link href={withLang("/submit?type=launch_support", lang)} className="inline-flex rounded-lg border border-brand-400/50 px-3 py-2 text-sm font-semibold text-brand-200 hover:border-brand-300 hover:text-brand-100">
            {lang === "ms" ? "Mohon Launch Support" : "Apply for Launch Support"}
          </Link>
        </div>
      ) : null}
    </section>
  );
}
