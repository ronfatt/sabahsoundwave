"use client";

import { DISTRICT_OPTIONS } from "@/lib/constants";
import { type Lang } from "@/lib/i18n";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const QUICK_GENRES = ["Rock", "Indie", "EDM", "Acoustic", "Hip Hop", "Alternative"] as const;

type SortValue = "featured" | "newest" | "az" | "district";

export function ArtistsDiscoveryControls({
  lang,
  resultCount
}: {
  lang: Lang;
  resultCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("q") || "";
  const district = searchParams.get("district") || "";
  const genre = searchParams.get("genre") || "";
  const sort = (searchParams.get("sort") as SortValue | null) || "featured";

  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  function pushParams(next: {
    q?: string;
    district?: string;
    genre?: string;
    sort?: SortValue;
  }) {
    const params = new URLSearchParams(searchParams.toString());

    const values = {
      q: next.q ?? query,
      district: next.district ?? district,
      genre: next.genre ?? genre,
      sort: next.sort ?? sort
    };

    if (values.q.trim()) params.set("q", values.q.trim());
    else params.delete("q");

    if (values.district) params.set("district", values.district);
    else params.delete("district");

    if (values.genre) params.set("genre", values.genre);
    else params.delete("genre");

    if (values.sort && values.sort !== "featured") params.set("sort", values.sort);
    else params.delete("sort");

    params.set("lang", lang);
    router.replace(`${pathname}?${params.toString()}`);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== initialQuery) {
        pushParams({ q: query });
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query, initialQuery]);

  function resetAll() {
    const params = new URLSearchParams();
    params.set("lang", lang);
    setQuery("");
    router.replace(`${pathname}?${params.toString()}`);
  }

  const sortLabel = useMemo(
    () => ({
      featured: lang === "ms" ? "Featured" : "Featured",
      newest: lang === "ms" ? "Terbaru" : "Newest",
      az: lang === "ms" ? "A-Z" : "A-Z",
      district: lang === "ms" ? "Daerah" : "District"
    }),
    [lang]
  );

  return (
    <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
      <div className="grid gap-3 md:grid-cols-4">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={lang === "ms" ? "Cari nama, genre, bio" : "Search name, genre, bio"}
          className="rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-200 md:col-span-2"
        />

        <select
          value={district}
          onChange={(event) => pushParams({ district: event.target.value })}
          className="rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-200"
        >
          <option value="">{lang === "ms" ? "Semua daerah" : "All districts"}</option>
          {DISTRICT_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(event) => pushParams({ sort: event.target.value as SortValue })}
          className="rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-200"
        >
          <option value="featured">{sortLabel.featured}</option>
          <option value="newest">{sortLabel.newest}</option>
          <option value="az">{sortLabel.az}</option>
          <option value="district">{sortLabel.district}</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {QUICK_GENRES.map((item) => {
          const active = genre === item;
          return (
            <button
              key={item}
              type="button"
              onClick={() => pushParams({ genre: active ? "" : item })}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                active
                  ? "border-brand-400 bg-brand-500/20 text-brand-200"
                  : "border-slate-700 bg-slate-900 text-slate-300 hover:border-brand-500"
              }`}
            >
              {item}
            </button>
          );
        })}
        <button
          type="button"
          onClick={resetAll}
          className="ml-auto rounded-lg border border-slate-600 px-3 py-1 text-xs font-semibold text-slate-300 hover:border-slate-400"
        >
          {lang === "ms" ? "Reset" : "Reset"}
        </button>
      </div>

      <p className="text-xs text-slate-400">
        {resultCount} {lang === "ms" ? "artis ditemui" : "artists found"}
      </p>
    </div>
  );
}
