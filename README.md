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

## Spotify discovery pipeline (playlist-first + search fallback)
Discover 200+ candidates with dedupe by `spotifyArtistId`, plus Sabah confidence + verification flags.

```bash
# dry run
npm run spotify:discover -- --target=220 --dry-run

# write to DB
npm run spotify:discover -- --target=220
```

New artist metadata fields used by discovery:
- `spotifyArtistId` (unique dedupe key)
- `discoverySource` (`PLAYLIST` / `SEARCH` / etc.)
- `verificationStatus` (`NEEDS_REVIEW` / `AUTO_APPROVED` / ...)
- `sabahConfidence` (0-100)
- `sourceTags` (playlist/search trace)

## Daily auto-sync (Vercel Cron)
Daily job endpoint: `/api/cron/daily-sync`
Legacy alias (still works): `/api/cron/spotify-daily`

What it does:
1. Discover new artists (`playlist-first`, then `search fallback`)
2. Enrich tracks/releases/followers for existing artists
3. Sync YouTube channel/search releases
4. Auto-approve high-confidence discoveries

Required env:
- `CRON_SECRET` (used by cron authorization)
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_PLAYLIST_IDS`
- `SPOTIFY_DISCOVERY_TARGET` (optional, default `220`)
- `SPOTIFY_SYNC_DAILY_LIMIT` (optional, default `180`)
- `YOUTUBE_API_KEY` (for YouTube discovery/sync)
- `YOUTUBE_CHANNEL_IDS` (comma-separated channel IDs, recommended)
- `YOUTUBE_SEARCH_TERMS` (optional comma-separated fallback terms)
- `YOUTUBE_SYNC_DAYS` (optional, default `30`)
- `YOUTUBE_SYNC_MAX_PER_CHANNEL` (optional, default `20`)
- `YOUTUBE_SYNC_MAX_SEARCH` (optional, default `30`)
- `YOUTUBE_MIN_STORE_CONFIDENCE` (optional, default `72`, lower confidence goes to candidate pool)
- `YOUTUBE_CHANNEL_PROMOTE_HITS` (optional, default `3`, auto-promote channel to seed after repeated hits)
- `SPOTIFY_AUTO_APPROVE_CONFIDENCE` (optional, default `90`)
- `YOUTUBE_AUTO_APPROVE_CONFIDENCE` (optional, default `90`, only channel-based candidates auto-approve)

## YouTube sync (optional)
Sync Sabah artist activity from YouTube channels + search:

```bash
# dry run
npm run youtube:sync -- --days=30 --dry-run

# write to DB
npm run youtube:sync -- --days=30
```

## Spotify CSV export (Node / recommended)
Export a CSV from playlist artist seeds, including Spotify URL, genres, top song (MY), and followers.

1. Set env:
```bash
export SPOTIFY_CLIENT_ID="your_client_id"
export SPOTIFY_CLIENT_SECRET="your_client_secret"
# optional override
export SPOTIFY_PLAYLIST_IDS="6suhLOSv1aTHZNzQ0JsCLk,247G4TJ3ueJmlz0NFjk48J,5kUQjSQG6IHvkzTbt0QcRS,6GeeBELId545dGVdlIpJpV,37i9dQZF1E4Ef9jlDv5pC8"
export SPOTIFY_EXPORT_CSV="sabah_spotify_artists_v1.csv"
```

2. Run:
```bash
npm run spotify:export-csv
```

3. Output:
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

## Spotify metadata fields (followers, top song, latest release)
If pulling latest code, sync DB schema first:

```bash
npx prisma db push
```

Then refresh artist Spotify metadata:

```bash
npm run spotify:enrich -- --limit=120
```

Or in `/admin`, use:
- `Sync Spotify now` (all visible artists)
- `Sync pending only` (faster)
