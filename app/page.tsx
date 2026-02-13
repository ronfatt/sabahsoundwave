import { ArtistCard } from "@/components/artist-card";
import { FilterBar } from "@/components/filter-bar";
import { Navbar } from "@/components/navbar";
import { DISTRICT_OPTIONS } from "@/lib/constants";
import { parseDistrict } from "@/lib/district";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

const WHY_JOIN = [
  {
    title: "Grow Sabah Reach",
    body: "Get discovered by listeners searching Sabah-specific artists and district scenes."
  },
  {
    title: "Fast Artist Onboarding",
    body: "Submit once and let admin help refine listing quality and release visibility."
  },
  {
    title: "Launch Support Path",
    body: "For unreleased artists, get guided support from Starter to Label-level planning."
  }
];

export default async function Home({
  searchParams
}: {
  searchParams: Promise<{ district?: string; genre?: string }>;
}) {
  const params = await searchParams;
  const district = parseDistrict(params.district);
  const genre = params.genre;

  const filter = {
    status: "APPROVED" as const,
    district,
    genres: genre ? { contains: genre } : undefined
  };

  const [featured, latest, districtCounts, nextDropEvent] = await Promise.all([
    prisma.artist.findMany({
      where: { ...filter, featured: true },
      orderBy: { updatedAt: "desc" },
      take: 4
    }),
    prisma.artist.findMany({
      where: filter,
      orderBy: { createdAt: "desc" },
      take: 8
    }),
    prisma.artist.groupBy({
      by: ["district"],
      where: { status: "APPROVED" },
      _count: { district: true }
    }),
    prisma.dropEvent.findFirst({
      where: { date: { gte: new Date() } },
      orderBy: { date: "asc" },
      include: {
        artists: {
          where: { status: "APPROVED" },
          select: { name: true }
        }
      }
    })
  ]);

  const districtCountMap = new Map(
    districtCounts.map((item) => [item.district, item._count.district])
  );

  return (
    <main>
      <Navbar />
      <section className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 md:px-6">
        <div className="space-y-4 rounded-2xl bg-slate-900 p-6 text-white">
          <p className="text-sm uppercase tracking-wide text-brand-100">Sabah-only music hub</p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Discover Sabah artists. Support local releases.</h1>
          <p className="max-w-2xl text-sm text-slate-200 md:text-base">
            Sabah Soundwave highlights artists from Kota Kinabalu, Tawau, Sandakan, and across Sabah. Listen, share, and help
            independent musicians reach new audiences.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              Submit Music
            </Link>
            <Link href="/launch-support" className="rounded-lg border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-100 hover:bg-brand-700">
              Launch Support
            </Link>
          </div>
        </div>

        <FilterBar district={district} genre={genre} />

        {nextDropEvent ? (
          <section className="rounded-2xl border border-brand-200 bg-brand-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Next Drop Day</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">{nextDropEvent.title}</h2>
            <p className="mt-1 text-sm text-slate-700">
              {new Date(nextDropEvent.date).toLocaleDateString("en-MY", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
              })}
              {" · "}
              {nextDropEvent.artists.length} artists in lineup
            </p>
            <Link
              href={`/drop/${nextDropEvent.id}`}
              className="mt-3 inline-flex rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              View Drop Day
            </Link>
          </section>
        ) : (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Drop Day</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">Next Drop Day coming soon</h2>
            <p className="mt-1 text-sm text-slate-600">Upcoming lineup will appear here once admin schedules the next event.</p>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Explore by District</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {DISTRICT_OPTIONS.map((item) => (
              <Link
                key={item.value}
                href={`/artists?district=${item.value}`}
                className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center shadow-sm transition hover:border-brand-500"
              >
                <p className="text-sm font-semibold text-slate-800">{item.shortLabel}</p>
                <p className="text-xs text-slate-500">{districtCountMap.get(item.value) ?? 0} artists</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Why Join</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {WHY_JOIN.map((item) => (
              <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-brand-200 bg-gradient-to-b from-brand-50 to-white p-4">
          <h2 className="text-2xl font-semibold">Featured artists</h2>
          {featured.length === 0 ? <p className="text-slate-600">No featured artists for this filter yet.</p> : null}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {featured.map((artist) => (
              <ArtistCard key={artist.id} {...artist} variant="featured" />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Latest approved artists</h2>
          {latest.length === 0 ? <p className="text-slate-600">No approved artists match this filter.</p> : null}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {latest.map((artist) => (
              <ArtistCard key={artist.id} {...artist} />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
