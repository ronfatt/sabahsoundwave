import { prisma } from "@/lib/prisma";

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
  followers?: { total?: number };
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

type SpotifyLatestReleaseResponse = {
  items?: Array<{
    name?: string;
    release_date?: string;
    release_date_precision?: "year" | "month" | "day";
    external_urls?: { spotify?: string };
  }>;
};

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

async function getTopTrack(token: string, artistId: string) {
  const markets = ["MY", "US", "GB"];
  for (const market of markets) {
    const response = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=${market}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.ok) continue;
    const data = (await response.json()) as SpotifyTopTracksResponse;
    const first = data.tracks?.[0];
    if (first?.external_urls?.spotify || first?.name) {
      return {
        url: first?.external_urls?.spotify,
        name: first?.name
      };
    }
  }
  return { url: undefined, name: undefined };
}

function toReleaseDate(value?: string, precision?: "year" | "month" | "day") {
  if (!value) return undefined;
  if (precision === "year") return new Date(`${value}-01-01T00:00:00.000Z`);
  if (precision === "month") return new Date(`${value}-01T00:00:00.000Z`);
  return new Date(`${value}T00:00:00.000Z`);
}

async function getLatestRelease(token: string, artistId: string) {
  const response = await fetch(
    `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=single,album&limit=1&market=MY`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!response.ok) return { name: undefined, date: undefined, url: undefined };
  const data = (await response.json()) as SpotifyLatestReleaseResponse;
  const first = data.items?.[0];
  const date = toReleaseDate(first?.release_date, first?.release_date_precision);
  return {
    name: first?.name,
    date: date && !Number.isNaN(date.getTime()) ? date : undefined,
    url: first?.external_urls?.spotify
  };
}

export async function enrichSpotifyArtists(options?: {
  limit?: number;
  pendingOnly?: boolean;
  dryRun?: boolean;
}) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET in environment.");
  }

  const dryRun = Boolean(options?.dryRun);
  const pendingOnly = Boolean(options?.pendingOnly);
  const limit = options?.limit;

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
      topTrackName: true,
      spotifyFollowers: true,
      latestReleaseName: true,
      latestReleaseDate: true,
      latestReleaseUrl: true,
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
    const topTrack = await getTopTrack(token.access_token, best.id);
    const latestRelease = await getLatestRelease(token.access_token, best.id);
    const nextGenres =
      artist.genres && artist.genres.trim().length > 0
        ? artist.genres
        : best.genres?.slice(0, 3).join(", ");

    if (!dryRun) {
      await prisma.artist.update({
        where: { id: artist.id },
        data: {
          spotifyUrl: best.external_urls?.spotify ?? artist.spotifyUrl ?? undefined,
          coverImageUrl: best.images?.[0]?.url ?? artist.coverImageUrl ?? undefined,
          topTrackUrl: topTrack.url ?? artist.topTrackUrl ?? undefined,
          topTrackName: topTrack.name ?? artist.topTrackName ?? undefined,
          latestReleaseName: latestRelease.name ?? artist.latestReleaseName ?? undefined,
          latestReleaseDate: latestRelease.date ?? artist.latestReleaseDate ?? undefined,
          latestReleaseUrl: latestRelease.url ?? artist.latestReleaseUrl ?? undefined,
          spotifyFollowers:
            typeof best.followers?.total === "number"
              ? best.followers.total
              : artist.spotifyFollowers ?? undefined,
          genres: nextGenres ?? artist.genres,
          lastSpotifySyncedAt: new Date()
        }
      });
      updated += 1;
    }
  }

  return {
    scanned: artists.length,
    matched,
    updated: dryRun ? 0 : updated,
    dryRun,
    noMatchCount: noMatch.length,
    noMatch
  };
}
