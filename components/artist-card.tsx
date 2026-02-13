import { getDistrictLabel } from "@/lib/district";
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
};

export function ArtistCard({ slug, name, district, genres, bio, coverImageUrl, featured, variant = "default" }: ArtistCardProps) {
  const isFeaturedVariant = variant === "featured";

  return (
    <article
      className={`overflow-hidden rounded-2xl bg-white shadow-sm ${
        isFeaturedVariant ? "border-2 border-brand-300 ring-2 ring-brand-100" : "border border-slate-200"
      }`}
    >
      <div
        className={`${isFeaturedVariant ? "h-48" : "h-40"} w-full bg-cover bg-center`}
        style={{
          backgroundImage: `url(${coverImageUrl || "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80"})`
        }}
      />
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{name}</h3>
            <p className="text-sm text-slate-600">{getDistrictLabel(district)}</p>
          </div>
          {featured ? (
            <span className="rounded-full bg-brand-100 px-2 py-1 text-xs font-semibold text-brand-700">Featured</span>
          ) : null}
        </div>
        <p className="line-clamp-2 text-sm text-slate-700">{bio}</p>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{genres}</p>
        <Link
          href={`/artists/${slug}`}
          className="inline-flex rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          View profile
        </Link>
      </div>
    </article>
  );
}
