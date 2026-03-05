import { prisma } from "../lib/prisma";

type SpotifyTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

type SpotifyArtist = {
  id: string;
  name: string;
  genres: string[];
  external_urls?: { spotify?: string };
  images?: Array<{ url: string; width: number; height: number }>;
  popularity?: number;
};

type SpotifySearchResponse = {
  artists?: {
    items: SpotifyArtist[];
  };
};

type SpotifyTopTracksResponse = {
  tracks: Array<{
    id: string;
    name: string;
    external_urls?: { spotify?: string };
  }>;
};

function getArgValue(flag: string) {
  const found = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  return found ? found.split("=")[1] : undefined;
}

function hasFlag(flag: string) {
  return process.argv.includes(flag);
}

function normalizeName(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function pickBestMatch(name: string, items: SpotifyArtist[]) {
  const target = normalizeName(name);
  if (items.length === 0) return null;

  const ranked = items
    .map((item) => {
      const current = normalizeName(item.name);
      let score = item.popularity ?? 0;
      if (current === target) score += 1000;
      else if (current.includes(target) || target.includes(current)) score += 200;
      return { item, score };
    })
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.item ?? null;
}

async function getSpotifyToken(clientId: string, clientSecret: string) {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Spotify token error (${response.status}): ${text}`);
  }

  return (await response.json()) as SpotifyTokenResponse;
}

async function searchArtist(token: string, name: string) {
  const query = encodeURIComponent(`artist:${name}`);
  const url = `https://api.spotify.com/v1/search?q=${query}&type=artist&limit=5&market=MY`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) return [];
  const data = (await response.json()) as SpotifySearchResponse;
  return data.artists?.items ?? [];
}

async function getTopTrackUrl(token: string, artistId: string) {
  const markets = ["MY", "US", "GB"];

  for (const market of markets) {
    const response = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=${market}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.ok) continue;
    const data = (await response.json()) as SpotifyTopTracksResponse;
    const link = data.tracks?.[0]?.external_urls?.spotify;
    if (link) return link;
  }

  return undefined;
}

async function main() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET in environment.");
  }

  const dryRun = hasFlag("--dry-run");
  const pendingOnly = hasFlag("--pending-only");
  const limitArg = getArgValue("--limit");
  const limit = limitArg ? Number(limitArg) : undefined;

  const token = await getSpotifyToken(clientId, clientSecret);
  const artists = await prisma.artist.findMany({
    where: pendingOnly ? { status: "PENDING" } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      spotifyUrl: true,
      coverImageUrl: true,
      topTrackUrl: true,
      genres: true
    }
  });

  let matched = 0;
  let updated = 0;
  const noMatch: string[] = [];

  for (const artist of artists) {
    const results = await searchArtist(token.access_token, artist.name);
    const best = pickBestMatch(artist.name, results);

    if (!best) {
      noMatch.push(artist.name);
      continue;
    }

    matched += 1;
    const spotifyUrl = best.external_urls?.spotify;
    const coverImageUrl = best.images?.[0]?.url;
    const topTrackUrl = await getTopTrackUrl(token.access_token, best.id);

    const nextGenres =
      artist.genres && artist.genres.trim().length > 0
        ? artist.genres
        : best.genres?.slice(0, 3).join(", ");

    if (!dryRun) {
      await prisma.artist.update({
        where: { id: artist.id },
        data: {
          spotifyUrl: spotifyUrl ?? artist.spotifyUrl ?? undefined,
          coverImageUrl: coverImageUrl ?? artist.coverImageUrl ?? undefined,
          topTrackUrl: topTrackUrl ?? artist.topTrackUrl ?? undefined,
          genres: nextGenres ?? artist.genres
        }
      });
      updated += 1;
    }
  }

  console.log(
    JSON.stringify(
      {
        scanned: artists.length,
        matched,
        updated: dryRun ? 0 : updated,
        dryRun,
        noMatchCount: noMatch.length,
        noMatch
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
