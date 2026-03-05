import { District, ListingType, SubmissionStatus } from "@prisma/client";
import { createUniqueSlug } from "../lib/slug";
import { prisma } from "../lib/prisma";
import fs from "node:fs";
import path from "node:path";

type CsvRow = {
  artist_name?: string;
  spotify_url?: string;
  followers?: string;
  top_song?: string;
  top_song_url?: string;
  latest_release?: string;
  latest_release_date?: string;
  latest_release_url?: string;
  genres?: string;
  monthly_listeners?: string;
  language?: string;
  district?: string;
};

const DISTRICT_ALIASES: Record<string, District> = {
  "kota kinabalu": "KOTA_KINABALU",
  kk: "KOTA_KINABALU",
  penampang: "PENAMPANG",
  papar: "PAPAR",
  sandakan: "SANDAKAN",
  tawau: "TAWAU",
  "lahad datu": "LAHAD_DATU",
  semporna: "SEMPORNA",
  keningau: "KENINGAU",
  ranau: "RANAU",
  kudat: "KUDAT",
  beaufort: "BEAUFORT",
  sipitang: "SIPITANG",
  tambunan: "TAMBUNAN",
  tuaran: "TUARAN",
  "kota belud": "KOTA_BELUD"
};

function getArg(flag: string) {
  const found = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  return found ? found.slice(flag.length + 1) : undefined;
}

function hasFlag(flag: string) {
  return process.argv.includes(flag);
}

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

function parseCsv(content: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const next = content[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(field);
      field = "";
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((value) => value.length > 0)) rows.push(row);
  }

  if (rows.length === 0) return [];

  const headers = rows[0].map((header, index) =>
    index === 0 ? header.replace(/^\uFEFF/, "").trim() : header.trim()
  );

  return rows.slice(1).map((dataRow) => {
    const result: Record<string, string> = {};
    headers.forEach((header, index) => {
      result[header] = (dataRow[index] ?? "").trim();
    });
    return result as CsvRow;
  });
}

function resolveDistrict(input: string | undefined, fallback: District) {
  const normalized = (input ?? "").trim().toLowerCase();
  if (!normalized) return fallback;
  return DISTRICT_ALIASES[normalized] ?? fallback;
}

function buildBio(row: CsvRow) {
  const followers = row.followers?.trim();
  const topSong = row.top_song?.trim();
  const genres = row.genres?.trim() || "Sabah Playlist Discovery";

  const parts = [
    `${row.artist_name} is a Sabah playlist discovery artist on Sabah Soundwave.`,
    `Core genres: ${genres}.`
  ];

  if (topSong) parts.push(`Top Spotify track: ${topSong}.`);
  if (followers) parts.push(`Spotify followers: ${followers}.`);
  parts.push("Profile is pending Sabah editorial verification.");

  return parts.join(" ");
}

async function main() {
  const fileArg = getArg("--file") || "sabah_spotify_artists_v1.csv";
  const filePath = path.isAbsolute(fileArg) ? fileArg : path.join(process.cwd(), fileArg);
  const dryRun = hasFlag("--dry-run");

  const statusArg = (getArg("--status") || "PENDING").toUpperCase();
  const createStatus: SubmissionStatus =
    statusArg === "APPROVED" || statusArg === "REJECTED" ? (statusArg as SubmissionStatus) : "PENDING";

  const typeArg = (getArg("--type") || "NORMAL_LISTING").toUpperCase();
  const listingType: ListingType = typeArg === "LAUNCH_SUPPORT" ? "LAUNCH_SUPPORT" : "NORMAL_LISTING";

  const districtArg = (getArg("--district") || "KOTA_KINABALU").toUpperCase();
  const fallbackDistrict: District =
    districtArg in DISTRICT_ALIASES
      ? DISTRICT_ALIASES[districtArg.toLowerCase()]
      : (districtArg as District) || "KOTA_KINABALU";

  if (!fs.existsSync(filePath)) {
    throw new Error(`CSV file not found: ${filePath}`);
  }

  const csvText = fs.readFileSync(filePath, "utf8");
  const rows = parseCsv(csvText);
  if (rows.length === 0) {
    throw new Error("CSV has no rows.");
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
      topTrackUrl: true,
      topTrackName: true,
      spotifyFollowers: true,
      latestReleaseName: true,
      latestReleaseDate: true,
      latestReleaseUrl: true,
      coverImageUrl: true,
      appleMusicUrl: true,
      youtubeUrl: true
    }
  });

  const byName = new Map(existing.map((item) => [normalizeName(item.name), item]));
  const slugSet = new Set(existing.map((item) => item.slug));

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const name = row.artist_name?.trim();
    if (!name) {
      skipped += 1;
      continue;
    }

    const normalizedName = normalizeName(name);
    const district = resolveDistrict(row.district, fallbackDistrict);
    const genres = row.genres?.trim() || "Sabah Playlist Discovery";
    const bio = buildBio({ ...row, artist_name: name });
    const spotifyUrl = row.spotify_url?.trim() || undefined;
    const topTrackUrl = row.top_song_url?.trim() || undefined;
    const topTrackName = row.top_song?.trim() || undefined;
    const latestReleaseName = row.latest_release?.trim() || undefined;
    const latestReleaseUrl = row.latest_release_url?.trim() || undefined;
    const latestReleaseDateRaw = row.latest_release_date?.trim() || "";
    const latestReleaseDate = latestReleaseDateRaw ? new Date(`${latestReleaseDateRaw}T00:00:00.000Z`) : undefined;
    const spotifyFollowers = row.followers?.trim() ? Number(row.followers.trim()) : undefined;

    const existingArtist = byName.get(normalizedName);
    if (existingArtist) {
      const patch = {
        genres: existingArtist.genres?.trim() ? existingArtist.genres : genres,
        bio: existingArtist.bio?.trim() ? existingArtist.bio : bio,
        spotifyUrl: existingArtist.spotifyUrl?.trim() ? existingArtist.spotifyUrl : spotifyUrl,
        topTrackUrl: existingArtist.topTrackUrl?.trim() ? existingArtist.topTrackUrl : topTrackUrl,
        topTrackName: existingArtist.topTrackName?.trim() ? existingArtist.topTrackName : topTrackName,
        latestReleaseName: existingArtist.latestReleaseName?.trim() ? existingArtist.latestReleaseName : latestReleaseName,
        latestReleaseUrl: existingArtist.latestReleaseUrl?.trim() ? existingArtist.latestReleaseUrl : latestReleaseUrl,
        latestReleaseDate:
          existingArtist.latestReleaseDate ??
          (latestReleaseDate && !Number.isNaN(latestReleaseDate.getTime()) ? latestReleaseDate : null),
        spotifyFollowers:
          typeof existingArtist.spotifyFollowers === "number"
            ? existingArtist.spotifyFollowers
            : Number.isFinite(spotifyFollowers)
              ? spotifyFollowers
              : null
      };

      const changed =
        patch.genres !== existingArtist.genres ||
        patch.bio !== existingArtist.bio ||
        patch.spotifyUrl !== existingArtist.spotifyUrl ||
        patch.topTrackUrl !== existingArtist.topTrackUrl ||
        patch.topTrackName !== existingArtist.topTrackName ||
        patch.latestReleaseName !== existingArtist.latestReleaseName ||
        patch.latestReleaseUrl !== existingArtist.latestReleaseUrl ||
        `${patch.latestReleaseDate ?? ""}` !== `${existingArtist.latestReleaseDate ?? ""}` ||
        patch.spotifyFollowers !== existingArtist.spotifyFollowers;

      if (changed && !dryRun) {
        await prisma.artist.update({ where: { id: existingArtist.id }, data: patch });
        updated += 1;
      } else if (changed && dryRun) {
        updated += 1;
      } else {
        skipped += 1;
      }
      continue;
    }

    if (!dryRun) {
      const slug = createUniqueSlug(name, slugSet);
      await prisma.artist.create({
        data: {
          slug,
          status: createStatus,
          type: listingType,
          hasSongReleased: Boolean(topTrackUrl || spotifyUrl),
          contactWhatsapp: "+601100000000",
          name,
          district,
          genres,
          bio,
          spotifyUrl,
          topTrackUrl,
          topTrackName,
          latestReleaseName,
          latestReleaseUrl,
          latestReleaseDate:
            latestReleaseDate && !Number.isNaN(latestReleaseDate.getTime()) ? latestReleaseDate : null,
          spotifyFollowers: Number.isFinite(spotifyFollowers) ? spotifyFollowers : null,
          featured: false
        }
      });
    }
    created += 1;
  }

  console.log(
    JSON.stringify(
      {
        file: filePath,
        scanned: rows.length,
        created,
        updated,
        skipped,
        dryRun,
        createStatus,
        listingType
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
