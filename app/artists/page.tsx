import { ArtistCard } from "@/components/artist-card";
import { ArtistsDiscoveryControls } from "@/components/artists-discovery-controls";
import { Navbar } from "@/components/navbar";
import { parseDistrict } from "@/lib/district";
import { parseLang } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Artists"
};

export default async function ArtistsPage({
  searchParams
}: {
  searchParams: Promise<{ district?: string; genre?: string; q?: string; sort?: string; lang?: string }>;
}) {
  const params = await searchParams;
  const lang = parseLang(params.lang);
  const district = parseDistrict(params.district);
  const genre = params.genre;
  const q = params.q?.trim();
  const sort = params.sort;

  const orderBy =
    sort === "newest"
      ? [{ createdAt: "desc" as const }]
      : sort === "az"
        ? [{ name: "asc" as const }]
        : sort === "district"
          ? [{ district: "asc" as const }, { name: "asc" as const }]
          : [{ featured: "desc" as const }, { updatedAt: "desc" as const }];

  const where = {
    status: "APPROVED" as const,
    district,
    genres: genre ? { contains: genre } : undefined,
    OR: q ? [{ name: { contains: q } }, { bio: { contains: q } }, { genres: { contains: q } }] : undefined
  };

  let artists: Awaited<ReturnType<typeof prisma.artist.findMany>> = [];
  let featuredArtists: Awaited<ReturnType<typeof prisma.artist.findMany>> = [];
  let loadError = false;

  try {
    [artists, featuredArtists] = await Promise.all([
      prisma.artist.findMany({ where, orderBy }),
      prisma.artist.findMany({
        where: { ...where, featured: true },
        orderBy: [{ updatedAt: "desc" }],
        take: 10
      })
    ]);
  } catch (error) {
    loadError = true;
    console.error("Artists page data fetch failed:", error);
  }

  return (
    <main>
      <Navbar />
      <section className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 md:px-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">{lang === "ms" ? "Artis" : "Artists"}</h1>
          <p className="text-slate-300">{lang === "ms" ? "Cari dan tapis artis serta band dari Sabah." : "Search and filter Sabah-based artists and bands."}</p>
        </div>

        <ArtistsDiscoveryControls lang={lang} resultCount={artists.length} />

        {loadError ? (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {lang === "ms"
              ? "Data artis tidak dapat dimuatkan sepenuhnya. Sila cuba sebentar lagi."
              : "Artist data could not be fully loaded. Please try again shortly."}
          </p>
        ) : null}

        {featuredArtists.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-slate-100">{lang === "ms" ? "Spotlight Artis Pilihan" : "Featured Spotlight"}</h2>
            <div className="flex gap-4 overflow-x-auto pb-1">
              {featuredArtists.map((artist) => (
                <div key={artist.id} className="min-w-[290px] max-w-[320px] flex-shrink-0">
                  <ArtistCard
                    {...artist}
                    lang={lang}
                    variant="featured"
                    topTrackUrl={artist.spotifyUrl || artist.appleMusicUrl || artist.youtubeUrl}
                  />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {artists.length === 0 ? <p className="text-slate-300">{lang === "ms" ? "Tiada artis diluluskan ditemui." : "No approved artists found."}</p> : null}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {artists.map((artist) => (
            <ArtistCard
              key={artist.id}
              {...artist}
              lang={lang}
              topTrackUrl={artist.spotifyUrl || artist.appleMusicUrl || artist.youtubeUrl}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
