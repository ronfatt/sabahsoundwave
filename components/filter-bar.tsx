"use client";

import { DISTRICT_OPTIONS, GENRES } from "@/lib/constants";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type FilterBarProps = {
  district?: string;
  genre?: string;
};

export function FilterBar({ district, genre }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedDistrict, setSelectedDistrict] = useState(district || "");
  const [selectedGenre, setSelectedGenre] = useState(genre || "");

  function apply(nextDistrict: string, nextGenre: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextDistrict) params.set("district", nextDistrict);
    else params.delete("district");

    if (nextGenre) params.set("genre", nextGenre);
    else params.delete("genre");

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
      <select
        name="district"
        value={selectedDistrict}
        onChange={(event) => {
          const value = event.target.value;
          setSelectedDistrict(value);
          apply(value, selectedGenre);
        }}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
      >
        <option value="">All districts</option>
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
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
      >
        <option value="">All genres</option>
        {GENRES.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </div>
  );
}
