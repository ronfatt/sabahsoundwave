import { getDistrictLabel } from "@/lib/district";
import { Lang, withLang } from "@/lib/i18n";
import Link from "next/link";

type ArtistCardProps = {
  slug: string;
  name: string;
  district: string;
  genres: string;
  bio: string;
  coverImageUrl: string | null;
  featured?: boolean;
  variant?: "default" | "featured";
  lang?: Lang;
};

export function ArtistCard({ slug, name, district, genres, bio, coverImageUrl, featured, variant = "default", lang = "en" }: ArtistCardProps) {
  const isFeaturedVariant = variant === "featured";

  return (
    <article
      className={`group overflow-hidden rounded-2xl bg-slate-900/80 shadow-[0_14px_32px_rgba(0,0,0,0.35)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_22px_45px_rgba(0,0,0,0.5)] ${
        isFeaturedVariant ? "border-2 border-brand-500/70 ring-1 ring-brand-400/40" : "border border-slate-800"
      }`}
    >
      <div
        className={`${isFeaturedVariant ? "h-56" : "h-44"} w-full bg-cover bg-center`}
        style={{
          backgroundImage: `url(${coverImageUrl || "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80"})`
        }}
      />
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">{name}</h3>
            <p className="text-sm text-slate-400">{getDistrictLabel(district)}</p>
          </div>
          {featured ? (
            <span className="rounded-full border border-brand-400/70 bg-brand-500/15 px-2 py-1 text-xs font-semibold text-brand-300 shadow-[0_0_16px_rgba(0,245,160,0.35)]">
              {lang === "ms" ? "Pilihan" : "Featured"}
            </span>
          ) : null}
        </div>
        <p className="line-clamp-2 text-sm text-slate-300">{bio}</p>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{genres}</p>
        <Link
          href={withLang(`/artists/${slug}`, lang)}
          className="inline-flex rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-brand-500"
        >
          {lang === "ms" ? "Lihat profil" : "View profile"}
        </Link>
      </div>
    </article>
  );
}
