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
  topTrackUrl?: string | null;
  featured?: boolean;
  variant?: "default" | "featured";
  lang?: Lang;
};

export function ArtistCard({ slug, name, district, genres, bio, coverImageUrl, topTrackUrl, featured, variant = "default", lang = "en" }: ArtistCardProps) {
  const isFeaturedVariant = variant === "featured";
  const surfaceClass = isFeaturedVariant
    ? "bg-slate-900/80 shadow-[0_16px_36px_rgba(0,0,0,0.45)] hover:shadow-[0_24px_48px_rgba(0,0,0,0.55)]"
    : "bg-slate-900/75 shadow-[0_10px_24px_rgba(0,0,0,0.3)] hover:shadow-[0_16px_30px_rgba(0,0,0,0.38)]";
  const tokens = genres
    .split(/[,/|]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const shownTags = tokens.slice(0, 2);
  const extraCount = Math.max(tokens.length - shownTags.length, 0);

  return (
    <article
      className={`group overflow-hidden rounded-2xl transition duration-200 hover:-translate-y-1 ${surfaceClass} ${
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
            <span
              className={`rounded-full border border-brand-400/70 bg-brand-500/15 px-2 py-1 text-xs font-semibold text-brand-300 ${
                isFeaturedVariant ? "shadow-[0_0_10px_rgba(0,245,160,0.25)]" : ""
              }`}
            >
              {lang === "ms" ? "Pilihan" : "Featured"}
            </span>
          ) : null}
        </div>
        <p className="line-clamp-2 text-sm text-slate-300">{bio}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {shownTags.map((tag) => (
            <span key={tag} className="rounded-full border border-slate-700 bg-slate-950/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-300">
              {tag}
            </span>
          ))}
          {extraCount > 0 ? (
            <span className="rounded-full border border-slate-700 bg-slate-950/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              +{extraCount}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={withLang(`/artists/${slug}`, lang)}
            className="inline-flex rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-slate-950 transition duration-200 hover:scale-[1.03] hover:bg-brand-500"
          >
            {lang === "ms" ? "Lihat profil" : "View profile"}
          </Link>
          {topTrackUrl ? (
            <Link
              href={topTrackUrl}
              target="_blank"
              className="inline-flex rounded-lg border border-brand-400/50 px-3 py-2 text-sm font-semibold text-brand-200 transition hover:border-brand-300 hover:text-brand-100"
            >
              {lang === "ms" ? "Dengar" : "Listen"}
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
