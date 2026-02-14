"use client";

import { Lang, withLang } from "@/lib/i18n";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

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
  const [animatedScore, setAnimatedScore] = useState(0);

  const quickChips = useMemo(
    () =>
      lang === "ms"
        ? [
            "Indie pop Tawau, fokus TikTok dan Reels",
            "Band rock KK, single pertama bulan depan",
            "Acoustic Sandakan, perlukan roadmap promosi"
          ]
        : [
            "Tawau indie pop launch with TikTok-first strategy",
            "KK rock band dropping first single next month",
            "Sandakan acoustic artist needing promo roadmap"
          ],
    [lang]
  );
  const roadmapItems = useMemo(() => {
    const source = result?.roadmap ?? [];
    const cleaned = source.filter((item) => typeof item === "string" && item.trim().length > 0).slice(0, 4);
    while (cleaned.length < 4) {
      cleaned.push(
        lang === "ms"
          ? "Tetapkan KPI mudah dan pantau hasil mingguan."
          : "Set simple KPIs and track weekly results."
      );
    }
    return cleaned;
  }, [result, lang]);

  useEffect(() => {
    if (!result) {
      setAnimatedScore(0);
      return;
    }
    const target = Math.max(0, Math.min(100, result.score));
    setAnimatedScore(0);
    const t = setTimeout(() => setAnimatedScore(target), 60);
    return () => clearTimeout(t);
  }, [result]);

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
    <section className="space-y-4 rounded-2xl border border-brand-500/30 bg-[radial-gradient(circle_at_top_left,rgba(0,245,160,0.12),transparent_45%),linear-gradient(180deg,rgba(15,23,42,0.88),rgba(2,6,23,0.92))] p-5 shadow-[0_18px_36px_rgba(0,0,0,0.45)]">
      <div>
        <p className="text-xs uppercase tracking-wide text-brand-300">AI Launch Readiness Check</p>
        <h2 className="text-2xl font-bold text-slate-100">{lang === "ms" ? "Semakan Kesediaan Launch AI" : "AI Launch Readiness Check"}</h2>
        <p className="mt-1 text-sm text-slate-300">
          {lang === "ms"
            ? "Terangkan pelan release anda. AI akan beri skor, kekuatan, penambahbaikan, dan pelan 4 minggu."
            : "Describe your release plan. AI will score readiness and generate strengths, improvements, and a 4-week roadmap."}
        </p>
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
        <div className="flex flex-wrap gap-2">
          {quickChips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setInput(chip)}
              className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs font-semibold text-slate-300 transition hover:border-brand-400 hover:text-brand-200"
            >
              {chip}
            </button>
          ))}
        </div>
        <button
          className="glow-cta inline-flex items-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-80"
          disabled={loading}
        >
          {loading ? <span className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-slate-950 border-r-transparent" /> : null}
          {loading
            ? lang === "ms"
              ? "AI sedang semak..."
              : "AI checking..."
            : lang === "ms"
              ? "Jana readiness score"
              : "Generate readiness score"}
        </button>
      </form>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      {result ? (
        <div className="space-y-3 rounded-xl border border-slate-700 bg-slate-950/60 p-4">
          <p className="text-sm font-semibold text-slate-200">
            <span className="font-semibold text-brand-300">Readiness Score:</span> {result.score}/100
          </p>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-400 to-emerald-300 transition-[width] duration-700 ease-out"
              style={{ width: `${animatedScore}%` }}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
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
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-200">
              {lang === "ms" ? "Roadmap 4 Minggu" : "4-Week Roadmap"}
            </p>
            <ol className="mt-2 space-y-1 text-sm text-slate-300">
              {roadmapItems.map((item, index) => (
                <li key={`${item}-${index}`}>
                  <span className="font-semibold text-brand-200">
                    {lang === "ms" ? `Minggu ${index + 1}: ` : `Week ${index + 1}: `}
                  </span>
                  {item}
                </li>
              ))}
            </ol>
          </div>
          <Link href={withLang("/submit?type=launch_support", lang)} className="inline-flex rounded-lg border border-brand-400/50 px-3 py-2 text-sm font-semibold text-brand-200 hover:border-brand-300 hover:text-brand-100">
            {lang === "ms" ? "Mohon Launch Support" : "Apply for Launch Support"}
          </Link>
        </div>
      ) : null}
    </section>
  );
}
