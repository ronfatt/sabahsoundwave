import { ArtistCard } from "@/components/artist-card";
import { FilterBar } from "@/components/filter-bar";
import { Navbar } from "@/components/navbar";
import { DISTRICT_OPTIONS } from "@/lib/constants";
import { parseDistrict } from "@/lib/district";
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

  const [featured, latest, districtCounts, nextDropEvent] = await Promise.all([
    prisma.artist.findMany({ where: { ...filter, featured: true }, orderBy: { updatedAt: "desc" }, take: 4 }),
    prisma.artist.findMany({ where: filter, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.artist.groupBy({ by: ["district"], where: { status: "APPROVED" }, _count: { district: true } }),
    prisma.dropEvent.findFirst({
      where: { date: { gte: new Date() } },
      orderBy: { date: "asc" },
      include: { artists: { where: { status: "APPROVED" }, select: { name: true } } }
    })
  ]);

  const districtCountMap = new Map(districtCounts.map((item) => [item.district, item._count.district]));

  const t = {
    tag: lang === "ms" ? "Hab muzik khas Sabah" : "Sabah-only music hub",
    title: lang === "ms" ? "Temui artis Sabah. Sokong karya tempatan." : "Discover Sabah artists. Support local releases.",
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
    latestEmpty: lang === "ms" ? "Tiada artis diluluskan untuk penapis ini." : "No approved artists match this filter."
  };

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
      <section className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 md:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-night-900 via-night-800 to-night-700 px-6 py-10 text-white md:px-8 md:py-14">
          <div className="pointer-events-none absolute -left-20 top-0 h-56 w-56 rounded-full bg-brand-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-brand-600/20 blur-3xl" />
          <div className="relative space-y-5">
            <p className="text-sm uppercase tracking-[0.18em] text-brand-200">{t.tag}</p>
            <h1 className="max-w-4xl text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">{t.title}</h1>
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

        <FilterBar district={district} genre={genre} lang={lang} />

        {nextDropEvent ? (
          <section className="rounded-2xl border border-brand-500/30 bg-slate-900/75 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-300">{t.nextDrop}</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-100">{nextDropEvent.title}</h2>
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
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Drop Day</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-100">{t.comingSoon}</h2>
            <p className="mt-1 text-sm text-slate-300">{t.comingSoonDesc}</p>
          </section>
        )}

        <section className="space-y-4 rounded-2xl border border-brand-500/30 bg-slate-950/90 p-6 shadow-[0_20px_40px_rgba(0,0,0,0.45)]">
          <h2 className="text-3xl font-bold text-white">{t.featured}</h2>
          {featured.length === 0 ? <p className="text-slate-300">{t.featuredEmpty}</p> : null}
          <div className="grid gap-5 md:grid-cols-2">
            {featured.map((artist) => (
              <ArtistCard key={artist.id} {...artist} variant="featured" lang={lang} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-100">{t.latest}</h2>
          {latest.length === 0 ? <p className="text-slate-400">{t.latestEmpty}</p> : null}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {latest.map((artist) => (
              <ArtistCard key={artist.id} {...artist} lang={lang} />
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
                className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-3 text-center shadow-sm transition duration-200 hover:scale-[1.02] hover:border-brand-400 hover:shadow-[0_10px_24px_rgba(0,0,0,0.35)]"
              >
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
