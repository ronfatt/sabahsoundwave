import { Navbar } from "@/components/navbar";
import { getDistrictLabel } from "@/lib/district";
import { parseLang, withLang } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function DropPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { id } = await params;
  const { lang: langParam } = await searchParams;
  const lang = parseLang(langParam);

  const dropEvent = await prisma.dropEvent.findUnique({
    where: { id },
    include: {
      artists: {
        where: { status: "APPROVED" },
        orderBy: { name: "asc" }
      }
    }
  });

  if (!dropEvent) notFound();

  return (
    <main>
      <Navbar />
      <section className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 md:px-6">
        <div className="space-y-3 rounded-2xl bg-slate-900 p-6 text-white">
          <p className="text-sm uppercase tracking-wide text-brand-100">Drop Day</p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{dropEvent.title}</h1>
          <p className="text-sm text-slate-200">
            {new Date(dropEvent.date).toLocaleDateString(lang === "ms" ? "ms-MY" : "en-MY", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric"
            })}
          </p>
          <p className="max-w-3xl text-sm text-slate-200 md:text-base">{dropEvent.description}</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">{lang === "ms" ? "Barisan Artis" : "Lineup"}</h2>
          {dropEvent.artists.length === 0 ? <p className="text-slate-600">{lang === "ms" ? "Belum ada artis diluluskan untuk Drop Day ini." : "No approved artists assigned yet."}</p> : null}
          <div className="grid gap-4 md:grid-cols-2">
            {dropEvent.artists.map((artist) => (
              <article key={artist.id} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{artist.name}</h3>
                  <p className="text-sm text-slate-600">{getDistrictLabel(artist.district)} · {artist.genres}</p>
                </div>
                <p className="line-clamp-3 text-sm text-slate-700">{artist.bio}</p>
                <div className="flex flex-wrap gap-2">
                  <Link href={withLang(`/artists/${artist.slug}`, lang)} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
                    {lang === "ms" ? "Lihat profil" : "View profile"}
                  </Link>
                  {artist.spotifyUrl ? (
                    <Link href={artist.spotifyUrl} target="_blank" className="rounded-lg bg-green-700 px-3 py-2 text-sm font-semibold text-white">
                      Spotify
                    </Link>
                  ) : null}
                  {artist.youtubeUrl ? (
                    <Link href={artist.youtubeUrl} target="_blank" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800">
                      YouTube
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
