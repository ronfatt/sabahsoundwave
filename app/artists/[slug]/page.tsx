import { getArtistSoundSignature } from "@/lib/ai-assist";
import { Navbar } from "@/components/navbar";
import { getDistrictLabel } from "@/lib/district";
import { parseLang, withLang } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

function getYoutubeEmbedUrl(url?: string | null) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "").trim();
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    return null;
  } catch {
    return null;
  }
}

function formatReleaseDate(value?: Date | string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

export default async function ArtistProfile({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { slug } = await params;
  const { lang: langParam } = await searchParams;
  const lang = parseLang(langParam);

  const artist = await prisma.artist.findFirst({ where: { slug, status: "APPROVED" } });
  if (!artist) notFound();

  try {
    await prisma.artist.update({
      where: { id: artist.id },
      data: {
        profileViewCount: { increment: 1 }
      }
    });
  } catch {
    // Keep profile render stable if schema is slightly behind.
  }

  const youtubeEmbed = getYoutubeEmbedUrl(artist.youtubeUrl);
  const formattedReleaseDate = formatReleaseDate(artist.latestReleaseDate);
  const followersLabel =
    typeof artist.spotifyFollowers === "number"
      ? new Intl.NumberFormat("en-MY").format(artist.spotifyFollowers)
      : null;
  let aiSignature = `${artist.genres} rooted in ${getDistrictLabel(artist.district)}, blending Sabah mood with expressive local storytelling.`;
  try {
    aiSignature = await getArtistSoundSignature({
      id: artist.id,
      name: artist.name,
      district: artist.district,
      genres: artist.genres,
      bio: artist.bio
    });
  } catch {
    // Fallback signature keeps profile render stable even if AI service fails.
  }

  return (
    <main>
      <Navbar />
      <section className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 md:px-6">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div
            className="h-56 bg-cover bg-center md:h-72"
            style={{
              backgroundImage: `url(${artist.coverImageUrl || "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80"})`
            }}
          />
          <div className="space-y-4 p-5">
            <h1 className="text-3xl font-bold tracking-tight">{artist.name}</h1>
            <p className="text-sm text-slate-500">{getDistrictLabel(artist.district)} · {artist.genres}</p>
            <p className="text-slate-700">{artist.bio}</p>
            {(artist.topTrackName || artist.latestReleaseName || followersLabel) ? (
              <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                {artist.topTrackName ? <p><span className="font-semibold">Top song:</span> {artist.topTrackName}</p> : null}
                {artist.latestReleaseName ? (
                  <p>
                    <span className="font-semibold">Latest release:</span> {artist.latestReleaseName}
                    {formattedReleaseDate ? ` · ${formattedReleaseDate}` : ""}
                  </p>
                ) : null}
                {followersLabel ? <p><span className="font-semibold">Spotify followers:</span> {followersLabel}</p> : null}
                {artist.lastSpotifySyncedAt ? (
                  <p className="text-xs text-slate-500">
                    Synced: {new Date(artist.lastSpotifySyncedAt).toLocaleString("en-MY")}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {artist.spotifyUrl ? (
                <Link href={`/api/track/listen/${artist.id}?target=spotify`} target="_blank" className="rounded-lg bg-green-700 px-3 py-2 text-sm font-semibold text-white">
                  {lang === "ms" ? "Buka di Spotify" : "Open on Spotify"}
                </Link>
              ) : null}
              {artist.topTrackUrl ? (
                <Link href={`/api/track/listen/${artist.id}?target=top`} target="_blank" className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white">
                  {lang === "ms" ? "Dengar lagu popular" : "Listen top song"}
                </Link>
              ) : null}
              {artist.latestReleaseUrl ? (
                <Link href={`/api/track/listen/${artist.id}?target=latest`} target="_blank" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800">
                  {lang === "ms" ? "Buka keluaran terbaru" : "Open latest release"}
                </Link>
              ) : null}
              {artist.appleMusicUrl ? (
                <Link href={`/api/track/listen/${artist.id}?target=apple`} target="_blank" className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
                  {lang === "ms" ? "Buka di Apple Music" : "Open on Apple Music"}
                </Link>
              ) : null}
              {artist.youtubeUrl ? (
                <Link href={`/api/track/listen/${artist.id}?target=youtube`} target="_blank" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800">
                  {lang === "ms" ? "Tonton di YouTube" : "Watch on YouTube"}
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        {youtubeEmbed ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <iframe
              src={youtubeEmbed}
              title={`${artist.name} YouTube player`}
              className="aspect-video w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : null}

        <section className="rounded-2xl border border-brand-500/30 bg-slate-900/70 p-4">
          <p className="text-xs uppercase tracking-wide text-brand-300">AI Sound Signature</p>
          <p className="mt-2 text-sm text-slate-200">{aiSignature}</p>
        </section>

        <Link href={withLang("/artists", lang)} className="inline-flex text-sm font-semibold text-brand-700 hover:text-brand-600">
          {lang === "ms" ? "Kembali ke senarai artis" : "Back to artists"}
        </Link>
      </section>
    </main>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const artist = await prisma.artist.findFirst({
    where: { slug, status: "APPROVED" },
    select: { name: true, bio: true }
  });

  if (!artist) {
    return {
      title: "Artist",
      description: "Discover Sabah artists, bands, and original music."
    };
  }

  return {
    title: `${artist.name} – Sabah Artist`,
    description: artist.bio
  };
}
