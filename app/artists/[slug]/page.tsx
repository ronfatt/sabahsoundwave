import { Navbar } from "@/components/navbar";
import { getDistrictLabel } from "@/lib/district";
import { prisma } from "@/lib/prisma";
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

export default async function ArtistProfile({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const artist = await prisma.artist.findFirst({
    where: { slug, status: "APPROVED" }
  });

  if (!artist) notFound();

  const youtubeEmbed = getYoutubeEmbedUrl(artist.youtubeUrl);

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

            <div className="flex flex-wrap gap-2">
              {artist.spotifyUrl ? (
                <Link
                  href={artist.spotifyUrl}
                  target="_blank"
                  className="rounded-lg bg-green-700 px-3 py-2 text-sm font-semibold text-white"
                >
                  Open on Spotify
                </Link>
              ) : null}
              {artist.appleMusicUrl ? (
                <Link
                  href={artist.appleMusicUrl}
                  target="_blank"
                  className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
                >
                  Open on Apple Music
                </Link>
              ) : null}
              {artist.youtubeUrl ? (
                <Link
                  href={artist.youtubeUrl}
                  target="_blank"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800"
                >
                  Watch on YouTube
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
      </section>
    </main>
  );
}
