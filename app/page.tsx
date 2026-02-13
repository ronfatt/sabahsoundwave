import { getDailyPickReason } from "@/lib/ai-assist";
import { ArtistCard } from "@/components/artist-card";
import { AiSoundFinder } from "@/components/ai-sound-finder";
import { FilterBar } from "@/components/filter-bar";
import { Navbar } from "@/components/navbar";
import { DISTRICT_OPTIONS } from "@/lib/constants";
import { getDistrictLabel, parseDistrict } from "@/lib/district";
import { parseLang, withLang } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function Home({
  searchParams
}: {
  searchParams: Promise<{ district?: string; genre?: string; lang?: string }>;
}) {
  const params = await searchParams;
  const lang = parseLang(params.lang);
  const district = parseDistrict(params.district);
  const genre = params.genre;

  const filter = {
    status: "APPROVED" as const,
    district,
    genres: genre ? { contains: genre } : undefined
  };

  let featured: Awaited<ReturnType<typeof prisma.artist.findMany>> = [];
  let latest: Awaited<ReturnType<typeof prisma.artist.findMany>> = [];
  let districtCounts: Array<{ district: string; _count: { district: number } }> = [];
  let nextDropEvent: {
    id: string;
    title: string;
    date: Date;
    description: string;
    artists: Array<{ name: string }>;
  } | null = null;
  let dailyCandidates: Array<{
    id: string;
    name: string;
    slug: string;
    district: string;
    genres: string;
    bio: string;
  }> = [];

  try {
    const [f, l, d, n, c] = await Promise.all([
      prisma.artist.findMany({ where: { ...filter, featured: true }, orderBy: { updatedAt: "desc" }, take: 4 }),
      prisma.artist.findMany({ where: filter, orderBy: { createdAt: "desc" }, take: 8 }),
      prisma.artist.groupBy({ by: ["district"], where: { status: "APPROVED" }, _count: { district: true } }),
      prisma.dropEvent.findFirst({
        where: { date: { gte: new Date() } },
        orderBy: { date: "asc" },
        include: { artists: { where: { status: "APPROVED" }, select: { name: true } } }
      }),
      prisma.artist.findMany({
        where: { status: "APPROVED" },
        select: { id: true, name: true, slug: true, district: true, genres: true, bio: true },
        orderBy: { name: "asc" }
      })
    ]);
    featured = f;
    latest = l;
    districtCounts = d;
    nextDropEvent = n;
    dailyCandidates = c;
  } catch (error) {
    console.error("Home page data fetch failed:", error);
  }

  const districtCountMap = new Map(districtCounts.map((item) => [item.district, item._count.district]));

  const t = {
    tag: "Sabah Soundwave",
    title: "One State. One Sound. One Wave.",
    subtitle: "The Official Home of Sabah Original Music.",
    desc:
      lang === "ms"
        ? "Sabah Soundwave menonjolkan artis dari Kota Kinabalu, Tawau, Sandakan dan seluruh Sabah. Dengar, kongsi dan sokong pemuzik tempatan."
        : "Sabah Soundwave highlights artists from Kota Kinabalu, Tawau, Sandakan, and across Sabah. Listen, share, and help independent musicians reach new audiences.",
    submit: lang === "ms" ? "Hantar Muzik" : "Submit Music",
    launch: "Launch Support",
    nextDrop: lang === "ms" ? "Drop Day Seterusnya" : "Next Drop Day",
    viewDrop: lang === "ms" ? "Lihat Drop Day" : "View Drop Day",
    comingSoon: lang === "ms" ? "Drop Day seterusnya akan datang" : "Next Drop Day coming soon",
    comingSoonDesc:
      lang === "ms"
        ? "Barisan artis akan dipaparkan selepas admin jadualkan acara seterusnya."
        : "Upcoming lineup will appear here once admin schedules the next event.",
    explore: lang === "ms" ? "Terokai Mengikut Daerah" : "Explore by District",
    artistsCount: lang === "ms" ? "artis" : "artists",
    whyJoin: lang === "ms" ? "Kenapa Sertai" : "Why Join",
    featured: lang === "ms" ? "Spotlight Artis Pilihan" : "Featured Spotlight",
    featuredEmpty: lang === "ms" ? "Tiada artis pilihan untuk penapis ini." : "No featured artists for this filter yet.",
    latest: lang === "ms" ? "Artis Diluluskan Terkini" : "Latest approved artists",
    latestEmpty: lang === "ms" ? "Tiada artis diluluskan untuk penapis ini." : "No approved artists match this filter.",
    dailyPick: lang === "ms" ? "Pilihan AI Harian" : "Daily AI Pick",
    dailyReasonLabel: lang === "ms" ? "Kenapa hari ini?" : "Why today?"
  };

  const todayKey = new Date().toISOString().slice(0, 10);
  const dailyPick =
    dailyCandidates.length > 0
      ? dailyCandidates[
          Number(todayKey.replace(/-/g, "")) % dailyCandidates.length
        ]
      : null;
  let dailyPickReason: string | null = null;
  if (dailyPick) {
    try {
      dailyPickReason = await getDailyPickReason({
        dateKey: `${todayKey}:${dailyPick.id}`,
        name: dailyPick.name,
        district: dailyPick.district,
        genres: dailyPick.genres,
        bio: dailyPick.bio
      });
    } catch {
      dailyPickReason = `Blends ${dailyPick.genres.toLowerCase()} with ${getDistrictLabel(dailyPick.district)} atmosphere for immersive Sabah listening sessions.`;
    }
  }

  const whyJoin =
    lang === "ms"
      ? [
          { title: "Luaskan capaian Sabah", body: "Mudah ditemui oleh pendengar yang mencari artis Sabah mengikut daerah." },
          { title: "Onboarding artis cepat", body: "Hantar sekali dan admin bantu kemaskan profil serta paparan lagu." },
          { title: "Laluan Launch Support", body: "Untuk artis belum rilis, dapatkan bimbingan dari Starter hingga Label." }
        ]
      : [
          { title: "Grow Sabah Reach", body: "Get discovered by listeners searching Sabah-specific artists and district scenes." },
          { title: "Fast Artist Onboarding", body: "Submit once and let admin help refine listing quality and release visibility." },
          { title: "Launch Support Path", body: "For unreleased artists, get guided support from Starter to Label-level planning." }
        ];

  return (
    <main>
      <Navbar />
      <section className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 md:px-6">
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-night-900 via-night-800 to-night-700 px-6 py-12 text-white md:px-8 md:py-16">
          <div className="pointer-events-none absolute -left-20 top-0 h-56 w-56 rounded-full bg-brand-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-brand-600/20 blur-3xl" />
          <div className="relative space-y-5">
            <p className="text-sm uppercase tracking-[0.18em] text-brand-200">{t.tag}</p>
            <h1 className="max-w-4xl text-4xl font-extrabold leading-[1.02] tracking-tight md:text-6xl">{t.title}</h1>
            <p className="max-w-2xl text-base font-semibold text-brand-100 md:text-lg">{t.subtitle}</p>
            <p className="max-w-2xl text-base text-slate-200 md:text-lg">{t.desc}</p>
            <div className="flex flex-wrap gap-3">
              <Link href={withLang("/submit", lang)} className="glow-cta rounded-xl bg-brand-500 px-5 py-3 text-sm font-bold uppercase tracking-wide text-slate-950">
                {t.submit}
              </Link>
              <Link
                href={withLang("/launch-support", lang)}
                className="rounded-xl border border-brand-500/50 bg-slate-900/60 px-5 py-3 text-sm font-semibold text-brand-200 transition hover:border-brand-300 hover:text-brand-100"
              >
                {t.launch}
              </Link>
            </div>
          </div>
        </div>

        <AiSoundFinder lang={lang} />

        {dailyPick ? (
          <section className="rounded-2xl border border-brand-500/25 bg-slate-900/70 p-5">
            <p className="text-xs uppercase tracking-wide text-brand-300">{t.dailyPick}</p>
            <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-slate-100">{dailyPick.name}</h2>
                <p className="text-sm text-slate-400">
                  {getDistrictLabel(dailyPick.district)} · {dailyPick.genres}
                </p>
              </div>
              <Link href={withLang(`/artists/${dailyPick.slug}`, lang)} className="rounded-lg border border-brand-400/50 px-3 py-2 text-sm font-semibold text-brand-200">
                {lang === "ms" ? "Lihat profil" : "View profile"}
              </Link>
            </div>
            <p className="mt-3 text-sm text-slate-300">
              <span className="font-semibold text-brand-200">{t.dailyReasonLabel} </span>
              {dailyPickReason}
            </p>
          </section>
        ) : null}

        {nextDropEvent ? (
          <section className="rounded-2xl border border-brand-500/30 bg-slate-900/75 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-300">
              <span aria-hidden="true" className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-500/20 text-brand-300">
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current">
                  <path d="M11.4 1.8 4.7 11h4l-1 7.2 7.6-10h-4l.1-6.4Z" />
                </svg>
              </span>
              {t.nextDrop}
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-100">{nextDropEvent.title}</h2>
            <p className="mt-1 text-sm text-slate-300">
              {new Date(nextDropEvent.date).toLocaleDateString(lang === "ms" ? "ms-MY" : "en-MY", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
              })}
              {" · "}
              {nextDropEvent.artists.length} {t.artistsCount}
            </p>
            <Link
              href={withLang(`/drop/${nextDropEvent.id}`, lang)}
              className="glow-cta mt-3 inline-flex rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-slate-950"
            >
              {t.viewDrop}
            </Link>
          </section>
        ) : (
          <section className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-5">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
              <span aria-hidden="true" className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-500/15 text-brand-300">
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current">
                  <path d="M11.4 1.8 4.7 11h4l-1 7.2 7.6-10h-4l.1-6.4Z" />
                </svg>
              </span>
              Drop Day
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-100">{t.comingSoon}</h2>
            <p className="mt-1 text-sm text-slate-300">{t.comingSoonDesc}</p>
          </section>
        )}

        <section className="space-y-4 rounded-2xl border border-brand-500/30 bg-[radial-gradient(circle_at_top_left,rgba(0,245,160,0.14),transparent_40%),linear-gradient(180deg,#060b15_0%,#0b1120_100%)] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.45)]">
          <h2 className="text-3xl font-bold text-white">{t.featured}</h2>
          {featured.length === 0 ? <p className="text-slate-300">{t.featuredEmpty}</p> : null}
          <div className="grid gap-5 md:grid-cols-2">
            {featured.map((artist) => (
              <ArtistCard
                key={artist.id}
                {...artist}
                variant="featured"
                lang={lang}
                topTrackUrl={artist.topTrackUrl || artist.spotifyUrl || artist.appleMusicUrl || artist.youtubeUrl}
              />
            ))}
          </div>
        </section>

        <FilterBar district={district} genre={genre} lang={lang} />

        <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/45 p-5">
          <h2 className="text-2xl font-semibold text-slate-100">{t.latest}</h2>
          {latest.length === 0 ? <p className="text-slate-400">{t.latestEmpty}</p> : null}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {latest.map((artist) => (
              <ArtistCard
                key={artist.id}
                {...artist}
                lang={lang}
                topTrackUrl={artist.topTrackUrl || artist.spotifyUrl || artist.appleMusicUrl || artist.youtubeUrl}
              />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-100">{t.explore}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {DISTRICT_OPTIONS.map((item) => (
              <Link
                key={item.value}
                href={withLang(`/artists?district=${item.value}`, lang)}
                className={`rounded-xl border px-3 py-3 text-center shadow-sm transition duration-200 hover:scale-[1.02] hover:shadow-[0_10px_24px_rgba(0,0,0,0.35)] ${
                  district === item.value
                    ? "border-brand-400 bg-slate-900/90 shadow-[inset_0_0_18px_rgba(0,245,160,0.18)]"
                    : "border-slate-700 bg-slate-900/70 hover:border-brand-400 hover:shadow-[inset_0_0_12px_rgba(0,245,160,0.12)]"
                }`}
              >
                <p className="text-[10px] uppercase tracking-widest text-brand-300">~</p>
                <p className="text-sm font-semibold text-slate-100">{item.shortLabel}</p>
                <p className="text-xs text-slate-400">
                  {districtCountMap.get(item.value) ?? 0} {t.artistsCount}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-100">{t.whyJoin}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {whyJoin.map((item) => (
              <article key={item.title} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-[0_12px_28px_rgba(0,0,0,0.3)]">
                <h3 className="text-lg font-semibold text-slate-100">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-300">{item.body}</p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
