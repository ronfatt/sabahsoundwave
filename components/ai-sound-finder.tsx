"use client";

import { Lang, withLang } from "@/lib/i18n";
import Link from "next/link";
import { FormEvent, useState } from "react";

type Recommendation = {
  id: string;
  slug: string;
  name: string;
  district: string;
  genres: string;
  reason: string;
};

export function AiSoundFinder({ lang }: { lang: Lang }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<Recommendation[]>([]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (query.trim().length < 4) {
      setError(lang === "ms" ? "Sila terangkan vibe dengan lebih jelas." : "Please describe your vibe in a bit more detail.");
      return;
    }

    setLoading(true);
    setError("");

    const response = await fetch("/api/ai/assist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sound_finder", payload: { query } })
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload) {
      setError(payload?.error || (lang === "ms" ? "Carian AI gagal." : "AI discovery failed."));
      setLoading(false);
      return;
    }

    setResults(Array.isArray(payload.recommendations) ? payload.recommendations : []);
    setLoading(false);
  }

  return (
    <section className="space-y-4 rounded-2xl border border-brand-500/30 bg-[radial-gradient(circle_at_top_left,rgba(0,245,160,0.12),transparent_45%),linear-gradient(180deg,rgba(15,23,42,0.82),rgba(2,6,23,0.9))] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
      <div>
        <p className="text-xs uppercase tracking-wide text-brand-300">AI-powered Discovery</p>
        <h2 className="text-2xl font-bold text-slate-100">{lang === "ms" ? "Temui dengan AI" : "Discover with AI"}</h2>
        <p className="text-sm text-slate-300">{lang === "ms" ? "Terangkan vibe muzik yang anda cari." : "Describe the vibe you’re looking for."}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={
            lang === "ms"
              ? "Contoh: Tawau rock untuk night driving"
              : "e.g. Tawau rock for night driving"
          }
          className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-200 transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
        />
        <button
          disabled={loading}
          className="glow-cta inline-flex items-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
        >
          {loading ? <span className="mr-2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-950 border-r-transparent" /> : null}
          {loading ? (lang === "ms" ? "AI sedang cari..." : "AI is finding...") : lang === "ms" ? "Cari vibe saya" : "Find my vibe"}
        </button>
      </form>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {loading ? (
        <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3 text-sm text-slate-300">
          <p className="inline-flex items-center gap-2">
            <span className="inline-flex gap-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-300" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-300 [animation-delay:140ms]" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-300 [animation-delay:280ms]" />
            </span>
            {lang === "ms" ? "AI sedang menganalisis vibe anda..." : "AI is analyzing your vibe..."}
          </p>
        </div>
      ) : null}

      {results.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-3">
          {results.map((item, index) => (
            <article
              key={item.id}
              className="result-reveal space-y-2 rounded-xl border border-slate-700 bg-slate-900 p-3"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <p className="font-semibold text-slate-100">{item.name}</p>
              <p className="text-xs text-slate-400">
                {item.district} · {item.genres}
              </p>
              <p className="text-sm text-slate-300">{item.reason}</p>
              <Link href={withLang(`/artists/${item.slug}`, lang)} className="inline-flex text-sm font-semibold text-brand-300 hover:text-brand-200">
                {lang === "ms" ? "Buka profil" : "Open profile"}
              </Link>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
