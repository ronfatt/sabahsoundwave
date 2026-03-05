import fs from "node:fs";
import path from "node:path";

type SpotifyTokenResponse = {
  access_token: string;
};

type PlaylistTracksResponse = {
  items: Array<{
    track: {
      artists: Array<{
        id: string;
      }>;
    } | null;
  }>;
  next: string | null;
};

type ArtistsResponse = {
  artists: Array<{
    id: string;
    name: string;
    external_urls?: { spotify?: string };
    genres?: string[];
    followers?: { total?: number };
  }>;
};

type TopTracksResponse = {
  tracks: Array<{
    name: string;
    external_urls?: { spotify?: string };
  }>;
};

const DEFAULT_PLAYLIST_IDS = [
  "6suhLOSv1aTHZNzQ0JsCLk",
  "247G4TJ3ueJmlz0NFjk48J",
  "5kUQjSQG6IHvkzTbt0QcRS",
  "6GeeBELId545dGVdlIpJpV",
  "37i9dQZF1E4Ef9jlDv5pC8"
];

function getArgValue(flag: string) {
  const found = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  return found ? found.slice(flag.length + 1) : undefined;
}

function parsePlaylistIds() {
  const arg = getArgValue("--playlists");
  const env = process.env.SPOTIFY_PLAYLIST_IDS;
  const raw = arg || env || DEFAULT_PLAYLIST_IDS.join(",");
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function csvEscape(value: string | number | undefined | null) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
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
    throw new Error(`Spotify token error (${response.status})`);
  }
  return (await response.json()) as SpotifyTokenResponse;
}

async function fetchAllPlaylistArtistIds(token: string, playlistId: string) {
  const ids = new Set<string>();
  let nextUrl: string | null = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100&fields=items(track(artists(id))),next`;

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      throw new Error(`Failed playlist tracks fetch (${response.status}) for ${playlistId}`);
    }
    const data = (await response.json()) as PlaylistTracksResponse;
    for (const item of data.items) {
      const track = item.track;
      if (!track) continue;
      for (const artist of track.artists) {
        if (artist.id) ids.add(artist.id);
      }
    }
    nextUrl = data.next;
  }

  return ids;
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

async function fetchTopTrack(token: string, artistId: string) {
  const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=MY`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) {
    return { name: "", url: "" };
  }
  const data = (await response.json()) as TopTracksResponse;
  const first = data.tracks?.[0];
  return {
    name: first?.name ?? "",
    url: first?.external_urls?.spotify ?? ""
  };
}

async function main() {
  const clientId = process.env.SPOTIFY_CLIENT_ID || process.env.SPOTIPY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || process.env.SPOTIPY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Missing SPOTIFY_CLIENT_ID/SPOTIFY_CLIENT_SECRET (or SPOTIPY_* fallback).");
  }

  const playlistIds = parsePlaylistIds();
  const outputName = process.env.SPOTIFY_EXPORT_CSV || getArgValue("--out") || "sabah_spotify_artists_v1.csv";
  const outputFile = path.isAbsolute(outputName) ? outputName : path.join(process.cwd(), outputName);

  const token = await getSpotifyToken(clientId, clientSecret);
  const uniqueArtistIds = new Set<string>();

  for (const playlistId of playlistIds) {
    const ids = await fetchAllPlaylistArtistIds(token.access_token, playlistId);
    for (const id of ids) uniqueArtistIds.add(id);
  }

  const artistIds = [...uniqueArtistIds];
  console.log(`Unique artists found from playlists: ${artistIds.length}`);

  const rows: Array<Record<string, string>> = [];
  for (let i = 0; i < artistIds.length; i += 50) {
    const chunk = artistIds.slice(i, i + 50);
    const artists = await fetchArtistsBatch(token.access_token, chunk);

    for (const artist of artists) {
      if (!artist) continue;
      const top = await fetchTopTrack(token.access_token, artist.id);
      rows.push({
        artist_name: artist.name || "",
        spotify_url: artist.external_urls?.spotify || "",
        followers: String(artist.followers?.total ?? ""),
        top_song: top.name,
        top_song_url: top.url,
        genres: (artist.genres || []).join(", "),
        monthly_listeners: "",
        language: "",
        district: ""
      });
    }
  }

  const headers = [
    "artist_name",
    "spotify_url",
    "followers",
    "top_song",
    "top_song_url",
    "genres",
    "monthly_listeners",
    "language",
    "district"
  ];

  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((key) => csvEscape(row[key])).join(","));
  }

  fs.writeFileSync(outputFile, `${lines.join("\n")}\n`, "utf8");
  console.log(`Saved: ${outputFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
