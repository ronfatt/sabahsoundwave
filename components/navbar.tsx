"use client";

import { parseLang, withLang } from "@/lib/i18n";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function Navbar() {
  const pathname = usePathname();
  const [queryString, setQueryString] = useState("");
  const lang = parseLang(new URLSearchParams(queryString).get("lang"));

  useEffect(() => {
    setQueryString(window.location.search);
  }, [pathname]);

  const links = [
    { href: "/", label: lang === "ms" ? "Utama" : "Home" },
    { href: "/artists", label: lang === "ms" ? "Artis" : "Artists" },
    { href: "/launch-support", label: "Launch Support" },
    { href: "/submit", label: lang === "ms" ? "Hantar Muzik" : "Submit Music" },
    { href: "/admin", label: "Admin" }
  ];

  const enParams = new URLSearchParams(queryString);
  enParams.set("lang", "en");
  const msParams = new URLSearchParams(queryString);
  msParams.set("lang", "ms");

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <Link href={withLang("/", lang)} className="text-base font-bold tracking-tight text-brand-700 md:text-lg">
          Sabah Soundwave
        </Link>
        <div className="flex items-center gap-3 text-sm font-medium text-slate-700 md:gap-6">
          {links.map((link) => (
            <Link key={link.href} href={withLang(link.href, lang)} className="transition hover:text-brand-600">
              {link.label}
            </Link>
          ))}
          <div className="flex items-center gap-1 rounded-lg border border-slate-300 p-1 text-xs">
            <Link
              href={`${pathname}${enParams.toString() ? `?${enParams.toString()}` : ""}`}
              className={`rounded px-2 py-1 ${lang === "en" ? "bg-slate-900 text-white" : "text-slate-600"}`}
            >
              EN
            </Link>
            <Link
              href={`${pathname}${msParams.toString() ? `?${msParams.toString()}` : ""}`}
              className={`rounded px-2 py-1 ${lang === "ms" ? "bg-slate-900 text-white" : "text-slate-600"}`}
            >
              BM
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
