"""
Sabah Spotify Artist Database Builder
- Pull unique artist IDs from multiple Spotify playlists
- Fetch artist details + top track + genres + followers
- Export to CSV

Monthly listeners is not available in Spotify Web API.
"""

from __future__ import annotations

import csv
import os
from collections import OrderedDict
from typing import Dict, Iterable, List

import spotipy
from spotipy.oauth2 import SpotifyClientCredentials


DEFAULT_PLAYLIST_IDS = [
    # The Sound of Lagu Sabahan
    "6suhLOSv1aTHZNzQ0JsCLk",
    # Sabahan Top Song
    "247G4TJ3ueJmlz0NFjk48J",
    # BEST SONG DUSUN SABAH
    "5kUQjSQG6IHvkzTbt0QcRS",
    # Lagu kadazan Dusun
    "6GeeBELId545dGVdlIpJpV",
    # Kupikupifm Radio
    "37i9dQZF1E4Ef9jlDv5pC8",
]


def parse_playlist_ids() -> List[str]:
    from_env = os.getenv("SPOTIFY_PLAYLIST_IDS", "").strip()
    if not from_env:
        return DEFAULT_PLAYLIST_IDS
    return [item.strip() for item in from_env.split(",") if item.strip()]


def get_spotify_client():
    cid = os.getenv("SPOTIPY_CLIENT_ID")
    secret = os.getenv("SPOTIPY_CLIENT_SECRET")
    if not cid or not secret:
        raise RuntimeError("Set SPOTIPY_CLIENT_ID and SPOTIPY_CLIENT_SECRET in environment variables.")
    auth = SpotifyClientCredentials(client_id=cid, client_secret=secret)
    return spotipy.Spotify(client_credentials_manager=auth)


def iter_playlist_tracks(sp, playlist_id: str) -> Iterable[dict]:
    offset = 0
    limit = 100
    while True:
        page = sp.playlist_items(
            playlist_id,
            offset=offset,
            limit=limit,
            additional_types=("track",),
        )
        items = page.get("items", [])
        if not items:
            break
        for item in items:
            track = (item or {}).get("track")
            if track:
                yield track
        offset += limit
        if page.get("next") is None:
            break


def build_rows(sp, playlist_ids: List[str]) -> List[Dict[str, str]]:
    artist_ids = OrderedDict()
    for pid in playlist_ids:
        for track in iter_playlist_tracks(sp, pid):
            for artist in track.get("artists", []):
                artist_id = artist.get("id")
                if artist_id:
                    artist_ids[artist_id] = True

    unique_artist_ids = list(artist_ids.keys())
    print(f"Unique artists found from playlists: {len(unique_artist_ids)}")

    rows: List[Dict[str, str]] = []
    batch_size = 50

    for i in range(0, len(unique_artist_ids), batch_size):
        batch = unique_artist_ids[i : i + batch_size]
        artists = sp.artists(batch)["artists"]
        for artist in artists:
            if not artist:
                continue

            artist_id = artist["id"]
            top_song = ""
            top_song_url = ""

            try:
                top_tracks = sp.artist_top_tracks(artist_id, country="MY").get("tracks", [])
                if top_tracks:
                    top_song = top_tracks[0]["name"]
                    top_song_url = top_tracks[0]["external_urls"]["spotify"]
            except Exception:
                pass

            rows.append(
                {
                    "artist_name": artist["name"],
                    "spotify_url": artist.get("external_urls", {}).get("spotify", ""),
                    "followers": str(artist.get("followers", {}).get("total", "")),
                    "top_song": top_song,
                    "top_song_url": top_song_url,
                    "genres": ", ".join(artist.get("genres", []) or []),
                    "monthly_listeners": "",
                    "language": "",
                    "district": "",
                }
            )

    return rows


def main():
    playlist_ids = parse_playlist_ids()
    sp = get_spotify_client()
    rows = build_rows(sp, playlist_ids)

    if not rows:
        print("No rows found. Check playlist IDs.")
        return

    out_file = os.getenv("SPOTIFY_EXPORT_CSV", "sabah_spotify_artists_v1.csv")
    with open(out_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    print(f"Saved: {out_file}")


if __name__ == "__main__":
    main()
