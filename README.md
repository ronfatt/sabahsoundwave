# Sabah Soundwave (MVP Scaffold)

Sabah-only music hub built with Next.js App Router, Tailwind, and Prisma.

## Included
- Pages: `/`, `/artists`, `/artists/[slug]`, `/submit`, `/admin`
- Launch Support page: `/launch-support` with Starter/Pro/Label content + CTA to `/submit?type=launch_support`
- Data model: `Artist` + `SubmissionStatus` (`PENDING`, `APPROVED`, `REJECTED`)
- Home: featured artists, latest approved artists, district + genre filters
- Home: `Explore by District` clickable grid linking to `/artists?district=...`
- Artists page: filter + search
- Artist profile: cover, bio, music links, YouTube embed (if valid URL)
- Submit page: creates a `PENDING` artist and shows success/error state
- Submit form fields include:
  - `type`: `normal_listing | launch_support`
  - `has_song_released`: `yes | no`
  - `upload_links` (optional URL)
  - `contact_whatsapp`
- Admin page: password gate (`ADMIN_PASSWORD`), approve/reject pending artists, edit artist data, toggle featured
- Admin submissions view grouped by `type` and `status`
- Drop Day feature:
  - Model: `DropEvent { id, title, date, description }` with many-to-many artist lineup
  - Admin can create Drop Day and assign multiple approved artists
  - Public page: `/drop/[id]`
  - Home shows upcoming Drop Day banner when available
- AI assist (OpenAI API):
  - Submit page: `AI 帮我写简介` generates editable bio draft
  - Admin pending submissions: `AI precheck` suggests Starter/Pro/Label and risk tags

## Run locally
1. Install dependencies
```bash
npm install
```
2. Configure environment
```bash
cp .env.example .env
```
3. Run Prisma migration + client generation
```bash
npx prisma migrate dev --name init
```
4. Seed sample Sabah artists (6 records)
```bash
npm run prisma:seed
```
5. Start the app
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment
- `DATABASE_URL="file:./dev.db"`
- `ADMIN_PASSWORD="change-me"`
- `OPENAI_API_KEY=""`
- `SPOTIFY_CLIENT_ID=""` (for artist auto-enrichment)
- `SPOTIFY_CLIENT_SECRET=""` (for artist auto-enrichment)
- `SPOTIFY_PLAYLIST_IDS=""` (comma-separated Spotify playlist IDs for bulk seeding)

## Basic validation/error handling
- Zod validation for submit/admin payloads
- Sabah district restricted to predefined Sabah district list
- District is normalized in DB using Prisma `District` enum (not free-text)
- URL fields validated when provided
- API returns 400/401/404 for invalid input/auth/not-found

## Spotify auto-enrich (optional)
Use Spotify API to enrich artists by name (cover image, Spotify URL, top track URL).

```bash
# Dry run (no DB write)
npm run spotify:enrich -- --pending-only --limit=30 --dry-run

# Write updates
npm run spotify:enrich -- --pending-only --limit=30
```

## Spotify playlist seed (optional)
Seed artists from Spotify playlists as a discovery pool (`PENDING` by default).

```bash
# Option A: set in .env
SPOTIFY_PLAYLIST_IDS="playlistId1,playlistId2,playlistId3"
npm run spotify:seed-playlists -- --dry-run
npm run spotify:seed-playlists

# Option B: pass IDs directly
npm run spotify:seed-playlists -- --playlists=playlistId1,playlistId2
```

## Spotify CSV export (Python / optional)
Export a CSV from playlist artist seeds, including Spotify URL, genres, top song (MY), and followers.

1. Install Python dependency:
```bash
pip install spotipy
```

2. Set env:
```bash
export SPOTIPY_CLIENT_ID="your_client_id"
export SPOTIPY_CLIENT_SECRET="your_client_secret"
# optional override
export SPOTIFY_PLAYLIST_IDS="6suhLOSv1aTHZNzQ0JsCLk,247G4TJ3ueJmlz0NFjk48J,5kUQjSQG6IHvkzTbt0QcRS,6GeeBELId545dGVdlIpJpV,37i9dQZF1E4Ef9jlDv5pC8"
```

3. Run:
```bash
python3 scripts/sabah_spotify_artist_csv.py
```

4. Output:
- `sabah_spotify_artists_v1.csv` (default)

## Import CSV back to DB (Step 3)
Bulk import CSV rows into `Artist` table (create new + fill missing fields on existing names).

```bash
# Dry run first
npm run spotify:import-csv -- --file=sabah_spotify_artists_v1.csv --dry-run

# Import as PENDING (recommended)
npm run spotify:import-csv -- --file=sabah_spotify_artists_v1.csv --status=PENDING --type=NORMAL_LISTING
```

After import, open `/admin` and use:
- `AI auto-review (dry run)`
- `AI auto-approve/reject`
