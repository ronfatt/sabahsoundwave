"use client";

import { useEffect, useState } from "react";

export function HeroHeadline({ text }: { text: string }) {
  const [shine, setShine] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    setShine(true);
    const timer = window.setTimeout(() => setShine(false), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <h1
      className={`max-w-4xl text-4xl font-extrabold leading-[1.02] tracking-tight md:text-6xl ${
        shine ? "headline-shine-once" : "text-slate-100"
      }`}
    >
      {text}
    </h1>
  );
}
