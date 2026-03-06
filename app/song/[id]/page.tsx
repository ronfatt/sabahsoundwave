import { Navbar } from "@/components/navbar";
import { SongShareButtons } from "@/components/song-share-buttons";
import { getDistrictLabel } from "@/lib/district";
import { parseLang, withLang } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function SongPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { id } = await params;
  const { lang: langParam } = await searchParams;
  const lang = parseLang(langParam);

  const artist = await prisma.artist.findUnique({ where: { id } });
  if (!artist) notFound();

  const songTitle = artist.topTrackName || artist.latestReleaseName || (lang === "ms" ? "Lagu terbaru" : "Latest track");
  const listenUrl = artist.topTrackUrl || artist.latestReleaseUrl || artist.spotifyUrl || artist.appleMusicUrl || artist.youtubeUrl;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.sabahsoundwave.com";
  const shareUrl = `${appUrl}/song/${artist.id}`;

  return (
    <main>
      <Navbar />
      <section className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 md:px-6">
        <article className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <p className="text-xs uppercase tracking-wide text-brand-300">Song Spotlight</p>
          <h1 className="text-3xl font-bold text-slate-100 md:text-4xl">{songTitle}</h1>
          <p className="text-sm text-slate-300">
            {lang === "ms" ? "Artis" : "Artist"}: {artist.name} · {getDistrictLabel(artist.district)}
          </p>
          {artist.latestReleaseDate ? (
            <p className="text-xs text-slate-400">
              {lang === "ms" ? "Tarikh rilis" : "Released"}: {new Date(artist.latestReleaseDate).toLocaleDateString(lang === "ms" ? "ms-MY" : "en-MY")}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {listenUrl ? (
              <Link href={listenUrl} target="_blank" className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-slate-950">
                {lang === "ms" ? "Dengar sekarang" : "Listen now"}
              </Link>
            ) : null}
            <Link href={withLang(`/artists/${artist.slug}`, lang)} className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200">
              {lang === "ms" ? "Profil artis" : "Artist profile"}
            </Link>
          </div>

          <SongShareButtons shareUrl={shareUrl} songTitle={songTitle} artistName={artist.name} />
        </article>
      </section>
    </main>
  );
}
