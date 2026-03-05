import { DiscoverySource, District, VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createUniqueSlug } from "@/lib/slug";

type SpotifyTokenResponse = { access_token: string };

type PlaylistResponse = { id: string; name: string };

type PlaylistTracksResponse = {
  items: Array<{
    track: {
      artists: Array<{
        id: string;
        name: string;
        external_urls?: { spotify?: string };
      }>;
    } | null;
  }>;
  next: string | null;
};

type SpotifyArtist = {
  id: string;
  name: string;
  popularity?: number;
  external_urls?: { spotify?: string };
  images?: Array<{ url: string }>;
  genres?: string[];
};

type ArtistsByIdsResponse = { artists?: SpotifyArtist[] };
type ArtistSearchResponse = { artists?: { items: SpotifyArtist[] } };

type Candidate = {
  spotifyArtistId: string;
  name: string;
  spotifyUrl?: string;
  coverImageUrl?: string;
  genres: string[];
  popularity?: number;
  sourcePlaylists: Set<string>;
  sourceSearchTerms: Set<string>;
};

const DEFAULT_DISTRICT: District = "KOTA_KINABALU";
const DEFAULT_TERMS = [
  "Sabahan",
  "Lagu Sabahan",
  "Kadazan",
  "Dusun",
  "Murut",
  "Kota Kinabalu",
  "Penampang",
  "Tuaran",
  "Ranau",
  "Keningau",
  "Kota Belud",
  "Tawau",
  "Sandakan"
];

function normalizeName(name: string) {
  return name.trim().toLowerCase();
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
  let nextUrl: string | null = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100&fields=items(track(artists(id,name,external_urls))),next`;

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

async function searchArtists(token: string, term: string) {
  const results: SpotifyArtist[] = [];
  for (const offset of [0, 50]) {
    const q = encodeURIComponent(term);
    const url = `https://api.spotify.com/v1/search?q=${q}&type=artist&market=MY&limit=50&offset=${offset}`;
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) break;
    const data = (await response.json()) as ArtistSearchResponse;
    const items = data.artists?.items ?? [];
    if (items.length === 0) break;
    results.push(...items);
  }
  return results;
}

async function fetchArtistsByIds(token: string, ids: string[]) {
  if (ids.length === 0) return [];
  const response = await fetch(`https://api.spotify.com/v1/artists?ids=${ids.join(",")}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return [];
  const data = (await response.json()) as ArtistsByIdsResponse;
  return data.artists ?? [];
}

function toConfidence(candidate: Candidate): number {
  const playlistBoost = Math.min(35, candidate.sourcePlaylists.size * 10);
  const searchBoost = Math.min(12, candidate.sourceSearchTerms.size * 3);
  const genreBoost = candidate.genres.some((g) => /(sabah|kadazan|dusun|borneo)/i.test(g)) ? 12 : 0;
  const popularityBoost = typeof candidate.popularity === "number" ? Math.min(8, Math.floor(candidate.popularity / 12)) : 0;
  return Math.max(45, Math.min(97, 45 + playlistBoost + searchBoost + genreBoost + popularityBoost));
}

function toVerificationStatus(confidence: number): VerificationStatus {
  if (confidence >= 88) return "AUTO_APPROVED";
  return "NEEDS_REVIEW";
}

function fallbackBio(name: string, source: Candidate) {
  if (source.sourcePlaylists.size > 0) {
    const from = [...source.sourcePlaylists].slice(0, 2).join(", ");
    return `${name} was discovered from Sabah-focused Spotify playlists (${from}). Profile is pending Sabah editorial verification.`;
  }
  const terms = [...source.sourceSearchTerms].slice(0, 2).join(", ");
  return `${name} was discovered from Sabah-focused Spotify search terms (${terms}). Profile is pending Sabah editorial verification.`;
}

export async function discoverSpotifyArtists(options?: {
  target?: number;
  playlistIds?: string[];
  searchTerms?: string[];
  dryRun?: boolean;
}) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET.");
  }

  const target = Math.max(50, options?.target ?? Number(process.env.SPOTIFY_DISCOVERY_TARGET || 220));
  const playlistIds = (options?.playlistIds ?? (process.env.SPOTIFY_PLAYLIST_IDS || "").split(",")).map((x) => x.trim()).filter(Boolean);
  const searchTerms = options?.searchTerms?.length ? options.searchTerms : DEFAULT_TERMS;
  const dryRun = Boolean(options?.dryRun);

  if (playlistIds.length === 0) {
    throw new Error("No Spotify playlist IDs configured. Set SPOTIFY_PLAYLIST_IDS.");
  }

  const token = await getSpotifyToken(clientId, clientSecret);
  const byId = new Map<string, Candidate>();
  const playlistNames: string[] = [];

  for (const playlistId of playlistIds) {
    const playlist = await fetchPlaylist(token.access_token, playlistId);
    playlistNames.push(playlist.name);
    const tracks = await fetchAllPlaylistTracks(token.access_token, playlistId);

    for (const row of tracks) {
      const track = row.track;
      if (!track) continue;
      for (const artist of track.artists) {
        if (!artist.id || !artist.name) continue;
        const current = byId.get(artist.id);
        if (current) {
          current.sourcePlaylists.add(playlist.name);
          continue;
        }
        byId.set(artist.id, {
          spotifyArtistId: artist.id,
          name: artist.name,
          spotifyUrl: artist.external_urls?.spotify,
          genres: [],
          sourcePlaylists: new Set([playlist.name]),
          sourceSearchTerms: new Set()
        });
      }
    }
  }

  if (byId.size < target) {
    for (const term of searchTerms) {
      if (byId.size >= target) break;
      const found = await searchArtists(token.access_token, term);
      for (const artist of found) {
        if (!artist.id || !artist.name) continue;
        const current = byId.get(artist.id);
        if (current) {
          current.sourceSearchTerms.add(term);
          continue;
        }
        byId.set(artist.id, {
          spotifyArtistId: artist.id,
          name: artist.name,
          spotifyUrl: artist.external_urls?.spotify,
          coverImageUrl: artist.images?.[0]?.url,
          popularity: artist.popularity,
          genres: artist.genres ?? [],
          sourcePlaylists: new Set(),
          sourceSearchTerms: new Set([term])
        });
      }
    }
  }

  const candidates = [...byId.values()];
  for (let i = 0; i < candidates.length; i += 50) {
    const ids = candidates.slice(i, i + 50).map((item) => item.spotifyArtistId);
    const details = await fetchArtistsByIds(token.access_token, ids);
    for (const detail of details) {
      const targetItem = byId.get(detail.id);
      if (!targetItem) continue;
      targetItem.genres = detail.genres ?? targetItem.genres;
      targetItem.coverImageUrl = targetItem.coverImageUrl || detail.images?.[0]?.url;
      targetItem.spotifyUrl = targetItem.spotifyUrl || detail.external_urls?.spotify;
      targetItem.popularity = typeof detail.popularity === "number" ? detail.popularity : targetItem.popularity;
    }
  }

  const existing = await prisma.artist.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      spotifyArtistId: true,
      genres: true,
      spotifyUrl: true,
      coverImageUrl: true,
      sabahConfidence: true,
      sourceTags: true
    }
  });

  const bySpotifyId = new Map(existing.filter((item) => item.spotifyArtistId).map((item) => [item.spotifyArtistId as string, item]));
  const byName = new Map(existing.map((item) => [normalizeName(item.name), item]));
  const slugSet = new Set(existing.map((item) => item.slug));

  let created = 0;
  let updated = 0;
  let unchanged = 0;

  for (const candidate of candidates) {
    const confidence = toConfidence(candidate);
    const verificationStatus = toVerificationStatus(confidence);
    const sourceType: DiscoverySource = candidate.sourcePlaylists.size > 0 ? "PLAYLIST" : "SEARCH";
    const sourceTag = [
      ...[...candidate.sourcePlaylists].map((name) => `playlist:${name}`),
      ...[...candidate.sourceSearchTerms].map((term) => `search:${term}`)
    ]
      .slice(0, 10)
      .join(" | ")
      .slice(0, 1000);
    const genres = candidate.genres.length > 0 ? candidate.genres.slice(0, 3).join(", ") : "Sabah Discovery";

    const existingArtist = bySpotifyId.get(candidate.spotifyArtistId) ?? byName.get(normalizeName(candidate.name));

    if (existingArtist) {
      const patch = {
        spotifyArtistId: existingArtist.spotifyArtistId || candidate.spotifyArtistId,
        spotifyUrl: existingArtist.spotifyUrl || candidate.spotifyUrl,
        coverImageUrl: existingArtist.coverImageUrl || candidate.coverImageUrl,
        genres: existingArtist.genres?.trim() ? existingArtist.genres : genres,
        discoverySource: sourceType,
        verificationStatus,
        sabahConfidence: Math.max(existingArtist.sabahConfidence ?? 0, confidence),
        sourceTags: sourceTag,
        discoveredAt: new Date()
      };
      const changed =
        patch.spotifyArtistId !== existingArtist.spotifyArtistId ||
        patch.spotifyUrl !== existingArtist.spotifyUrl ||
        patch.coverImageUrl !== existingArtist.coverImageUrl ||
        patch.genres !== existingArtist.genres ||
        patch.sabahConfidence !== existingArtist.sabahConfidence ||
        patch.sourceTags !== existingArtist.sourceTags;

      if (changed) {
        updated += 1;
        if (!dryRun) {
          await prisma.artist.update({ where: { id: existingArtist.id }, data: patch });
        }
      } else {
        unchanged += 1;
      }
      continue;
    }

    created += 1;
    if (!dryRun) {
      const slug = createUniqueSlug(candidate.name, slugSet);
      await prisma.artist.create({
        data: {
          slug,
          status: "PENDING",
          type: "NORMAL_LISTING",
          spotifyArtistId: candidate.spotifyArtistId,
          discoverySource: sourceType,
          verificationStatus,
          sabahConfidence: confidence,
          sourceTags: sourceTag,
          discoveredAt: new Date(),
          hasSongReleased: true,
          contactWhatsapp: "+601100000000",
          name: candidate.name,
          district: DEFAULT_DISTRICT,
          genres,
          bio: fallbackBio(candidate.name, candidate),
          spotifyUrl: candidate.spotifyUrl,
          coverImageUrl: candidate.coverImageUrl,
          featured: false
        }
      });
    }
  }

  return {
    target,
    dryRun,
    playlistCount: playlistIds.length,
    playlistNames,
    searchTerms,
    discoveredUnique: candidates.length,
    created,
    updated,
    unchanged
  };
}
