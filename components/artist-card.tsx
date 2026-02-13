import { getDistrictLabel } from "@/lib/district";
import { Lang, withLang } from "@/lib/i18n";
import Link from "next/link";

type ArtistCardProps = {
  slug: string;
  name: string;
  district: string;
  genres: string;
  bio: string;
  aiSummary?: string | null;
  coverImageUrl: string | null;
  spotifyUrl?: string | null;
  youtubeUrl?: string | null;
  appleMusicUrl?: string | null;
  topTrackUrl?: string | null;
  featured?: boolean;
  variant?: "default" | "featured";
  lang?: Lang;
};

function PlatformIcon({ kind }: { kind: "spotify" | "youtube" | "apple" }) {
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-600 bg-slate-900/85 text-[10px] font-bold uppercase tracking-wide text-slate-200">
      {kind === "spotify" ? "S" : kind === "youtube" ? "Y" : "A"}
    </span>
  );
}

export function ArtistCard({
  slug,
  name,
  district,
  genres,
  bio,
  aiSummary,
  coverImageUrl,
  spotifyUrl,
  youtubeUrl,
  appleMusicUrl,
  topTrackUrl,
  featured,
  variant = "default",
  lang = "en"
}: ArtistCardProps) {
  const isFeaturedVariant = variant === "featured";
  const listenUrl = topTrackUrl || spotifyUrl || youtubeUrl || appleMusicUrl;
  const surfaceClass = isFeaturedVariant
    ? "bg-[linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,0.95))] shadow-[0_16px_36px_rgba(0,0,0,0.45)]"
    : "bg-[linear-gradient(180deg,rgba(15,23,42,0.78),rgba(2,6,23,0.88))] shadow-[0_10px_24px_rgba(0,0,0,0.3)]";
  const tokens = genres
    .split(/[,/|]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const shownTags = tokens.slice(0, 2);
  const extraCount = Math.max(tokens.length - shownTags.length, 0);

  return (
    <article
      className={`group overflow-hidden rounded-2xl border transition duration-200 hover:-translate-y-1 ${
        isFeaturedVariant ? "border-brand-500/70 ring-1 ring-brand-400/35" : "border-slate-800"
      } ${surfaceClass} ${
        isFeaturedVariant
          ? "hover:shadow-[0_22px_48px_rgba(0,0,0,0.55),0_0_0_1px_rgba(0,245,160,0.4)]"
          : "hover:shadow-[0_18px_34px_rgba(0,0,0,0.42),0_0_0_1px_rgba(0,245,160,0.28)]"
      }`}
    >
      <div className="relative overflow-hidden">
        <div
          className={`${isFeaturedVariant ? "h-56" : "h-44"} w-full bg-cover bg-center transition duration-200 group-hover:scale-[1.02]`}
          style={{
            backgroundImage: `url(${coverImageUrl || "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80"})`
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
        {featured ? (
          <span
            className={`absolute left-3 top-3 rounded-full border border-brand-400/80 bg-brand-500/20 px-2.5 py-1 text-[11px] font-semibold text-brand-200 shadow-[0_0_10px_rgba(0,245,160,0.2)] ${
              isFeaturedVariant ? "shadow-[0_0_12px_rgba(0,245,160,0.32)]" : ""
            }`}
          >
            {lang === "ms" ? "Pilihan" : "Featured"}
          </span>
        ) : null}

        <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
          {spotifyUrl ? <PlatformIcon kind="spotify" /> : null}
          {youtubeUrl ? <PlatformIcon kind="youtube" /> : null}
          {appleMusicUrl ? <PlatformIcon kind="apple" /> : null}
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">{name}</h3>
          <p className="text-sm text-slate-400">{getDistrictLabel(district)}</p>
        </div>
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

        {aiSummary ? (
          <p className="line-clamp-1 text-xs text-brand-200">
            <span className="font-semibold">✨ AI Sound:</span> {aiSummary}
          </p>
        ) : null}

        <p className="line-clamp-2 text-sm text-slate-300">{bio}</p>

        <div className="flex flex-wrap gap-2">
          {listenUrl ? (
            <Link
              href={listenUrl}
              target="_blank"
              className="inline-flex rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-brand-400"
            >
              {lang === "ms" ? "Dengar" : "Listen"}
            </Link>
          ) : null}
          <Link
            href={withLang(`/artists/${slug}`, lang)}
            className="inline-flex rounded-lg border border-slate-500/70 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-brand-300 hover:text-brand-200"
          >
            {lang === "ms" ? "Lihat profil" : "View Profile"}
          </Link>
        </div>
      </div>
    </article>
  );
}
