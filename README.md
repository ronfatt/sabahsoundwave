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

## Basic validation/error handling
- Zod validation for submit/admin payloads
- Sabah district restricted to predefined Sabah district list
- District is normalized in DB using Prisma `District` enum (not free-text)
- URL fields validated when provided
- API returns 400/401/404 for invalid input/auth/not-found
