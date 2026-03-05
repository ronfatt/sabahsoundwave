import { District } from "@prisma/client";
import { createUniqueSlug } from "../lib/slug";
import { prisma } from "../lib/prisma";

type SpotifyTokenResponse = {
  access_token: string;
};

type PlaylistResponse = {
  id: string;
  name: string;
};

type PlaylistTracksResponse = {
  items: Array<{
    track: {
      id: string;
      name: string;
      artists: Array<{
        id: string;
        name: string;
        external_urls?: { spotify?: string };
      }>;
    } | null;
  }>;
  next: string | null;
};

type ArtistsResponse = {
  artists: Array<{
    id: string;
    genres: string[];
    images: Array<{ url: string; width: number; height: number }>;
    external_urls?: { spotify?: string };
    popularity: number;
  }>;
};

type SeedArtist = {
  spotifyArtistId: string;
  name: string;
  spotifyUrl?: string;
  sourcePlaylists: Set<string>;
  genres: string[];
  coverImageUrl?: string;
};

const DEFAULT_DISTRICT: District = "KOTA_KINABALU";

function getArgValue(flag: string) {
  const found = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  return found ? found.slice(flag.length + 1) : undefined;
}

function normalizeName(input: string) {
  return input.trim().toLowerCase();
}

function parsePlaylistIds() {
  const fromArg = getArgValue("--playlists");
  const raw = fromArg || process.env.SPOTIFY_PLAYLIST_IDS || "";
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
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
    throw new Error(`Spotify token request failed (${response.status})`);
  }
  return (await response.json()) as SpotifyTokenResponse;
}

async function fetchPlaylist(token: string, playlistId: string) {
  const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}?fields=id,name`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) {
    throw new Error(`Playlist ${playlistId} fetch failed (${response.status})`);
  }
  return (await response.json()) as PlaylistResponse;
}

async function fetchAllPlaylistTracks(token: string, playlistId: string) {
  const tracks: PlaylistTracksResponse["items"] = [];
  let nextUrl: string | null = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100&fields=items(track(id,name,artists(id,name,external_urls))),next`;

  while (nextUrl) {
    const response = await fetch(nextUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) {
      throw new Error(`Playlist tracks fetch failed (${response.status}) for ${playlistId}`);
    }
    const data = (await response.json()) as PlaylistTracksResponse;
    tracks.push(...data.items);
    nextUrl = data.next;
  }

  return tracks;
}

async function fetchArtistsBatch(token: string, artistIds: string[]) {
  if (artistIds.length === 0) return [];
  const response = await fetch(`https://api.spotify.com/v1/artists?ids=${artistIds.join(",")}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return [];
  const data = (await response.json()) as ArtistsResponse;
  return data.artists ?? [];
}

function fallbackBio(name: string, sourcePlaylists: string[]) {
  const from = sourcePlaylists.slice(0, 2).join(", ");
  return `${name} was discovered from Sabah-focused Spotify playlists (${from}). This profile is pending Sabah editorial verification and metadata refinement.`;
}

async function main() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET.");
  }

  const playlistIds = parsePlaylistIds();
  if (playlistIds.length === 0) {
    throw new Error("No playlist IDs provided. Use --playlists=id1,id2 or SPOTIFY_PLAYLIST_IDS.");
  }

  const dryRun = process.argv.includes("--dry-run");

  const token = await getSpotifyToken(clientId, clientSecret);
  const artistMap = new Map<string, SeedArtist>();
  const playlistNames: string[] = [];

  for (const playlistId of playlistIds) {
    const playlist = await fetchPlaylist(token.access_token, playlistId);
    playlistNames.push(`${playlist.name} (${playlist.id})`);
    const items = await fetchAllPlaylistTracks(token.access_token, playlistId);

    for (const row of items) {
      const track = row.track;
      if (!track) continue;

      for (const artist of track.artists) {
        if (!artist.id || !artist.name) continue;
        const key = artist.id;
        const existing = artistMap.get(key);
        if (existing) {
          existing.sourcePlaylists.add(playlist.name);
          continue;
        }
        artistMap.set(key, {
          spotifyArtistId: artist.id,
          name: artist.name,
          spotifyUrl: artist.external_urls?.spotify,
          sourcePlaylists: new Set([playlist.name]),
          genres: []
        });
      }
    }
  }

  const allArtists = [...artistMap.values()];
  const detailById = new Map<string, ArtistsResponse["artists"][number]>();

  for (let i = 0; i < allArtists.length; i += 50) {
    const chunk = allArtists.slice(i, i + 50).map((item) => item.spotifyArtistId);
    const details = await fetchArtistsBatch(token.access_token, chunk);
    for (const detail of details) {
      detailById.set(detail.id, detail);
    }
  }

  for (const artist of allArtists) {
    const detail = detailById.get(artist.spotifyArtistId);
    if (!detail) continue;
    artist.genres = detail.genres ?? [];
    artist.coverImageUrl = detail.images?.[0]?.url;
    if (!artist.spotifyUrl && detail.external_urls?.spotify) {
      artist.spotifyUrl = detail.external_urls.spotify;
    }
  }

  const existing = await prisma.artist.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      genres: true,
      bio: true,
      spotifyUrl: true,
      coverImageUrl: true
    }
  });

  const byName = new Map(existing.map((item) => [normalizeName(item.name), item]));
  const slugSet = new Set(existing.map((item) => item.slug));

  let created = 0;
  let updated = 0;
  let unchanged = 0;

  for (const item of allArtists) {
    const sourcePlaylists = [...item.sourcePlaylists].sort();
    const genres = item.genres.length > 0 ? item.genres.slice(0, 3).join(", ") : "Sabah Playlist Discovery";
    const existingArtist = byName.get(normalizeName(item.name));

    if (existingArtist) {
      const nextData = {
        genres: existingArtist.genres?.trim() ? existingArtist.genres : genres,
        spotifyUrl: existingArtist.spotifyUrl?.trim() ? existingArtist.spotifyUrl : item.spotifyUrl,
        coverImageUrl: existingArtist.coverImageUrl?.trim() ? existingArtist.coverImageUrl : item.coverImageUrl
      };

      const changed =
        nextData.genres !== existingArtist.genres ||
        nextData.spotifyUrl !== existingArtist.spotifyUrl ||
        nextData.coverImageUrl !== existingArtist.coverImageUrl;

      if (changed && !dryRun) {
        await prisma.artist.update({ where: { id: existingArtist.id }, data: nextData });
        updated += 1;
      } else if (changed && dryRun) {
        updated += 1;
      } else {
        unchanged += 1;
      }
      continue;
    }

    if (!dryRun) {
      const slug = createUniqueSlug(item.name, slugSet);
      await prisma.artist.create({
        data: {
          slug,
          status: "PENDING",
          type: "NORMAL_LISTING",
          hasSongReleased: true,
          contactWhatsapp: "+601100000000",
          name: item.name,
          district: DEFAULT_DISTRICT,
          genres,
          bio: fallbackBio(item.name, sourcePlaylists),
          spotifyUrl: item.spotifyUrl,
          coverImageUrl: item.coverImageUrl,
          featured: false
        }
      });
    }
    created += 1;
  }

  console.log(
    JSON.stringify(
      {
        playlists: playlistNames,
        uniqueSpotifyArtists: allArtists.length,
        created,
        updated,
        unchanged,
        dryRun
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
