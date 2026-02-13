import { ArtistCard } from "@/components/artist-card";
import { Navbar } from "@/components/navbar";
import { DISTRICT_OPTIONS, GENRES } from "@/lib/constants";
import { parseDistrict } from "@/lib/district";
import { prisma } from "@/lib/prisma";

export default async function ArtistsPage({
  searchParams
}: {
  searchParams: Promise<{ district?: string; genre?: string; q?: string }>;
}) {
  const params = await searchParams;
  const district = parseDistrict(params.district);
  const genre = params.genre;
  const q = params.q;

  const artists = await prisma.artist.findMany({
    where: {
      status: "APPROVED",
      district,
      genres: genre ? { contains: genre } : undefined,
      OR: q
        ? [
            { name: { contains: q } },
            { bio: { contains: q } },
            { genres: { contains: q } }
          ]
        : undefined
    },
    orderBy: [{ featured: "desc" }, { name: "asc" }]
  });

  return (
    <main>
      <Navbar />
      <section className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 md:px-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Artists</h1>
          <p className="text-slate-600">Search and filter Sabah-based artists and bands.</p>
        </div>

        <form className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
          <input
            name="q"
            defaultValue={q || ""}
            placeholder="Search name, genre, bio"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2"
          />
          <select name="district" defaultValue={district || ""} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
            <option value="">All districts</option>
            {DISTRICT_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <select name="genre" defaultValue={genre || ""} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
            <option value="">All genres</option>
            {GENRES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 md:col-span-4">
            Search
          </button>
        </form>

        {artists.length === 0 ? <p className="text-slate-600">No approved artists found.</p> : null}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {artists.map((artist) => (
            <ArtistCard key={artist.id} {...artist} />
          ))}
        </div>
      </section>
    </main>
  );
}
