import { DropDayCountdown } from "@/components/dropday-countdown";
import { Navbar } from "@/components/navbar";
import { parseLang, withLang } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

function nextFridayAt8pmMY() {
  const now = new Date();
  const nowMy = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const day = nowMy.getUTCDay();
  const daysUntilFriday = (5 - day + 7) % 7;

  const targetMy = new Date(nowMy);
  targetMy.setUTCDate(nowMy.getUTCDate() + daysUntilFriday);
  targetMy.setUTCHours(20, 0, 0, 0);

  if (targetMy.getTime() <= nowMy.getTime()) {
    targetMy.setUTCDate(targetMy.getUTCDate() + 7);
  }

  return new Date(targetMy.getTime() - 8 * 60 * 60 * 1000);
}

export default async function WeeklyDropDayPage({
  searchParams
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang: langParam } = await searchParams;
  const lang = parseLang(langParam);
  const target = nextFridayAt8pmMY();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const songs = await prisma.artist.findMany({
    where: {
      status: "APPROVED",
      latestReleaseDate: { gte: weekAgo },
      OR: [{ topTrackUrl: { not: null } }, { latestReleaseUrl: { not: null } }, { spotifyUrl: { not: null } }, { youtubeUrl: { not: null } }]
    },
    select: {
      id: true,
      slug: true,
      name: true,
      topTrackName: true,
      topTrackUrl: true,
      latestReleaseName: true,
      latestReleaseDate: true,
      latestReleaseUrl: true,
      spotifyUrl: true,
      youtubeUrl: true
    },
    orderBy: [{ latestReleaseDate: "desc" }, { lastSpotifySyncedAt: "desc" }],
    take: 24
  });

  return (
    <main>
      <Navbar />
      <section className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 md:px-6">
        <div className="space-y-3 rounded-2xl border border-brand-500/30 bg-slate-900/70 p-6">
          <p className="text-xs uppercase tracking-wide text-brand-300">Weekly Drop Day</p>
          <h1 className="text-3xl font-bold text-slate-100 md:text-4xl">
            {lang === "ms" ? "Rilisan Sabah Mingguan" : "Weekly Sabah Release Drop"}
          </h1>
          <p className="text-sm text-slate-300">
            {lang === "ms" ? "Setiap Jumaat, 8:00 PM (MYT)" : "Every Friday, 8:00 PM (MYT)"}
          </p>
          <DropDayCountdown targetIso={target.toISOString()} />
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-100">{lang === "ms" ? "Pilihan Minggu Ini" : "This Week Picks"}</h2>
          {songs.length === 0 ? (
            <p className="text-sm text-slate-400">{lang === "ms" ? "Belum ada lagu baru minggu ini." : "No new tracks found this week yet."}</p>
          ) : null}
          <div className="grid gap-3 md:grid-cols-2">
            {songs.map((song) => {
              const title = song.topTrackName || song.latestReleaseName || (lang === "ms" ? "Lagu terbaru" : "Latest track");
              const listenUrl = song.topTrackUrl || song.latestReleaseUrl || song.spotifyUrl || song.youtubeUrl;
              return (
                <article key={song.id} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                  <p className="text-sm font-semibold text-slate-100">{title}</p>
                  <p className="text-xs text-slate-400">{song.name}</p>
                  {song.latestReleaseDate ? (
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(song.latestReleaseDate).toLocaleDateString(lang === "ms" ? "ms-MY" : "en-MY")}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {listenUrl ? (
                      <Link href={`/api/track/listen/${song.id}`} target="_blank" className="rounded-lg bg-brand-500 px-3 py-2 text-xs font-semibold text-slate-950">
                        {lang === "ms" ? "Dengar" : "Listen"}
                      </Link>
                    ) : null}
                    <Link href={withLang(`/song/${song.id}`, lang)} className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-200">
                      {lang === "ms" ? "Kongsi" : "Share"}
                    </Link>
                    <Link href={`/api/track/artist/${song.id}/visit?lang=${lang}`} className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-200">
                      {lang === "ms" ? "Profil" : "Profile"}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}
