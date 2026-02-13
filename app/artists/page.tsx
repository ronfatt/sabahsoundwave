import { ArtistCard } from "@/components/artist-card";
import { Navbar } from "@/components/navbar";
import { DISTRICT_OPTIONS, GENRES } from "@/lib/constants";
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
  searchParams: Promise<{ district?: string; genre?: string; q?: string; lang?: string }>;
}) {
  const params = await searchParams;
  const lang = parseLang(params.lang);
  const district = parseDistrict(params.district);
  const genre = params.genre;
  const q = params.q;

  const artists = await prisma.artist.findMany({
    where: {
      status: "APPROVED",
      district,
      genres: genre ? { contains: genre } : undefined,
      OR: q ? [{ name: { contains: q } }, { bio: { contains: q } }, { genres: { contains: q } }] : undefined
    },
    orderBy: [{ featured: "desc" }, { name: "asc" }]
  });

  return (
    <main>
      <Navbar />
      <section className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 md:px-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{lang === "ms" ? "Artis" : "Artists"}</h1>
          <p className="text-slate-600">{lang === "ms" ? "Cari dan tapis artis serta band dari Sabah." : "Search and filter Sabah-based artists and bands."}</p>
        </div>

        <form className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
          <input type="hidden" name="lang" value={lang} />
          <input
            name="q"
            defaultValue={q || ""}
            placeholder={lang === "ms" ? "Cari nama, genre, bio" : "Search name, genre, bio"}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2"
          />
          <select name="district" defaultValue={district || ""} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
            <option value="">{lang === "ms" ? "Semua daerah" : "All districts"}</option>
            {DISTRICT_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <select name="genre" defaultValue={genre || ""} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
            <option value="">{lang === "ms" ? "Semua genre" : "All genres"}</option>
            {GENRES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 md:col-span-4">
            {lang === "ms" ? "Cari" : "Search"}
          </button>
        </form>

        {artists.length === 0 ? <p className="text-slate-600">{lang === "ms" ? "Tiada artis diluluskan ditemui." : "No approved artists found."}</p> : null}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {artists.map((artist) => (
            <ArtistCard key={artist.id} {...artist} lang={lang} />
          ))}
        </div>
      </section>
    </main>
  );
}
