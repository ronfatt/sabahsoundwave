"use client";

import { DISTRICT_OPTIONS, GENRES } from "@/lib/constants";
import { Lang } from "@/lib/i18n";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type FilterBarProps = {
  district?: string;
  genre?: string;
  lang?: Lang;
};

export function FilterBar({ district, genre, lang = "en" }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedDistrict, setSelectedDistrict] = useState(district || "");
  const [selectedGenre, setSelectedGenre] = useState(genre || "");

  function apply(nextDistrict: string, nextGenre: string) {
    const params = new URLSearchParams();

    if (nextDistrict) params.set("district", nextDistrict);
    if (nextGenre) params.set("genre", nextGenre);
    params.set("lang", lang);

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.25)] md:grid-cols-2">
      <select
        name="district"
        value={selectedDistrict}
        onChange={(event) => {
          const value = event.target.value;
          setSelectedDistrict(value);
          apply(value, selectedGenre);
        }}
        className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-200 transition focus:border-brand-500 focus:outline-none"
      >
        <option value="">{lang === "ms" ? "Semua daerah" : "All districts"}</option>
        {DISTRICT_OPTIONS.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>

      <select
        name="genre"
        value={selectedGenre}
        onChange={(event) => {
          const value = event.target.value;
          setSelectedGenre(value);
          apply(selectedDistrict, value);
        }}
        className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-200 transition focus:border-brand-500 focus:outline-none"
      >
        <option value="">{lang === "ms" ? "Semua genre" : "All genres"}</option>
        {GENRES.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </div>
  );
}
