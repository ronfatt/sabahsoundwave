import { District } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createUniqueSlug } from "@/lib/slug";

type YoutubeSearchItem = {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    channelTitle?: string;
    channelId?: string;
    publishedAt?: string;
    thumbnails?: {
      high?: { url?: string };
      medium?: { url?: string };
      default?: { url?: string };
    };
  };
};

type YoutubeSearchResponse = {
  items?: YoutubeSearchItem[];
};

type SourceType = "YOUTUBE_CHANNEL" | "YOUTUBE_SEARCH";

type Candidate = {
  artistName: string;
  channelTitle: string;
  channelId: string;
  songTitle: string;
  videoId: string;
  publishedAt: Date;
  thumbnailUrl?: string;
  sourceType: SourceType;
  sourceTerm?: string;
};

const DEFAULT_DISTRICT: District = "KOTA_KINABALU";
const DEFAULT_TERMS = [
  "Lagu Sabahan rasmi",
  "Kadazan Dusun official song",
  "Sabah original song",
  "Sabahan music video"
];

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function cleanChannelName(input: string) {
  return input
    .replace(/\s*-\s*topic$/i, "")
    .replace(/\s*official\s*$/i, "")
    .replace(/\s*music\s*$/i, "")
    .trim();
}

function extractArtistName(channelTitle: string, songTitle: string) {
  const cleanedChannel = cleanChannelName(channelTitle);
  const title = songTitle.trim();
  const separators = [" - ", " – ", " | ", " feat ", " ft "];
  for (const separator of separators) {
    const idx = title.toLowerCase().indexOf(separator.trim().toLowerCase());
    if (idx > 1) {
      const left = title.slice(0, idx).trim();
      if (left.length >= 2 && left.length <= 60) return left;
    }
  }
  return cleanedChannel || "Unknown Artist";
}

function toYoutubeWatchUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

function toYoutubeChannelUrl(channelId: string) {
  return `https://www.youtube.com/channel/${channelId}`;
}

async function fetchYoutubeSearch(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`YouTube API error (${response.status}): ${text}`);
  }
  return (await response.json()) as YoutubeSearchResponse;
}

function parseChannelIds(raw?: string) {
  return (raw || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function parseSearchTerms(raw?: string) {
  const fromEnv = (raw || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  return fromEnv.length > 0 ? fromEnv : DEFAULT_TERMS;
}

function confidenceFor(sourceType: SourceType, songTitle: string) {
  const base = sourceType === "YOUTUBE_CHANNEL" ? 84 : 66;
  const officialBoost = /official|mv|music video|lyric/i.test(songTitle) ? 6 : 0;
  return Math.max(50, Math.min(96, base + officialBoost));
}

function verificationFromConfidence(confidence: number) {
  if (confidence >= 88) return "AUTO_APPROVED" as const;
  return "NEEDS_REVIEW" as const;
}

function pickNewest(a: Candidate, b: Candidate) {
  return a.publishedAt.getTime() >= b.publishedAt.getTime() ? a : b;
}

export async function syncYoutubeArtists(options?: {
  dryRun?: boolean;
  days?: number;
  maxPerChannel?: number;
  maxSearchResults?: number;
}) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing YOUTUBE_API_KEY in environment.");
  }

  const dryRun = Boolean(options?.dryRun);
  const days = Math.max(7, Number(options?.days || process.env.YOUTUBE_SYNC_DAYS || 30));
  const maxPerChannel = Math.max(5, Math.min(50, Number(options?.maxPerChannel || process.env.YOUTUBE_SYNC_MAX_PER_CHANNEL || 20)));
  const maxSearchResults = Math.max(10, Math.min(50, Number(options?.maxSearchResults || process.env.YOUTUBE_SYNC_MAX_SEARCH || 30)));
  const minStoreConfidence = Math.max(50, Math.min(95, Number(process.env.YOUTUBE_MIN_STORE_CONFIDENCE || 72)));
  const promoteHitThreshold = Math.max(2, Number(process.env.YOUTUBE_CHANNEL_PROMOTE_HITS || 3));

  const publishedAfter = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const envChannelIds = parseChannelIds(process.env.YOUTUBE_CHANNEL_IDS);
  const searchTerms = parseSearchTerms(process.env.YOUTUBE_SEARCH_TERMS);

  const dbSeedChannels = await prisma.youtubeSeedChannel.findMany({
    where: { active: true },
    select: { channelId: true, channelTitle: true, hitCount: true, promoted: true }
  });

  const channelSource = new Map<string, { title: string; via: "env" | "db" }>();
  for (const id of envChannelIds) channelSource.set(id, { title: "Env Seed", via: "env" });
  for (const channel of dbSeedChannels) {
    if (!channelSource.has(channel.channelId)) {
      channelSource.set(channel.channelId, { title: channel.channelTitle, via: "db" });
    }
  }

  const byArtistKey = new Map<string, Candidate>();
  const channelHitMap = new Map<string, { channelTitle: string; hits: number }>();

  for (const [channelId] of channelSource) {
    const url =
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&order=date` +
      `&channelId=${encodeURIComponent(channelId)}&maxResults=${maxPerChannel}` +
      `&publishedAfter=${encodeURIComponent(publishedAfter)}&key=${encodeURIComponent(apiKey)}`;

    const data = await fetchYoutubeSearch(url);
    for (const item of data.items || []) {
      const videoId = item.id?.videoId;
      const snippet = item.snippet;
      if (!videoId || !snippet?.title || !snippet.channelId || !snippet.publishedAt) continue;

      const publishedAt = new Date(snippet.publishedAt);
      if (Number.isNaN(publishedAt.getTime())) continue;

      channelHitMap.set(snippet.channelId, {
        channelTitle: snippet.channelTitle || "Unknown Channel",
        hits: (channelHitMap.get(snippet.channelId)?.hits || 0) + 1
      });

      const artistName = extractArtistName(snippet.channelTitle || "", snippet.title);
      const key = normalizeName(artistName);
      if (!key) continue;

      const candidate: Candidate = {
        artistName,
        channelTitle: snippet.channelTitle || artistName,
        channelId: snippet.channelId,
        songTitle: snippet.title,
        videoId,
        publishedAt,
        thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url,
        sourceType: "YOUTUBE_CHANNEL"
      };

      const existing = byArtistKey.get(key);
      byArtistKey.set(key, existing ? pickNewest(existing, candidate) : candidate);
    }
  }

  for (const term of searchTerms) {
    const url =
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&order=date` +
      `&q=${encodeURIComponent(term)}&maxResults=${maxSearchResults}&regionCode=MY` +
      `&publishedAfter=${encodeURIComponent(publishedAfter)}&key=${encodeURIComponent(apiKey)}`;

    const data = await fetchYoutubeSearch(url);
    for (const item of data.items || []) {
      const videoId = item.id?.videoId;
      const snippet = item.snippet;
      if (!videoId || !snippet?.title || !snippet.channelId || !snippet.publishedAt) continue;

      const publishedAt = new Date(snippet.publishedAt);
      if (Number.isNaN(publishedAt.getTime())) continue;

      channelHitMap.set(snippet.channelId, {
        channelTitle: snippet.channelTitle || "Unknown Channel",
        hits: (channelHitMap.get(snippet.channelId)?.hits || 0) + 1
      });

      const artistName = extractArtistName(snippet.channelTitle || "", snippet.title);
      const key = normalizeName(artistName);
      if (!key) continue;

      const candidate: Candidate = {
        artistName,
        channelTitle: snippet.channelTitle || artistName,
        channelId: snippet.channelId,
        songTitle: snippet.title,
        videoId,
        publishedAt,
        thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url,
        sourceType: "YOUTUBE_SEARCH",
        sourceTerm: term
      };

      const existing = byArtistKey.get(key);
      if (!existing) {
        byArtistKey.set(key, candidate);
      } else if (existing.sourceType === "YOUTUBE_SEARCH") {
        byArtistKey.set(key, pickNewest(existing, candidate));
      }
    }
  }

  if (!dryRun) {
    for (const [channelId, info] of channelHitMap.entries()) {
      const existing = dbSeedChannels.find((x) => x.channelId === channelId);
      const nextHit = (existing?.hitCount || 0) + info.hits;
      await prisma.youtubeSeedChannel.upsert({
        where: { channelId },
        create: {
          channelId,
          channelTitle: info.channelTitle,
          source: envChannelIds.includes(channelId) ? "ENV" : "AUTO",
          active: true,
          promoted: nextHit >= promoteHitThreshold,
          hitCount: nextHit,
          lastSeenAt: new Date()
        },
        update: {
          channelTitle: info.channelTitle,
          hitCount: nextHit,
          promoted: nextHit >= promoteHitThreshold || (existing?.promoted ?? false),
          active: true,
          lastSeenAt: new Date()
        }
      });
    }
  }

  const promotedCount = dryRun
    ? [...channelHitMap.values()].filter((x) => x.hits >= promoteHitThreshold).length
    : await prisma.youtubeSeedChannel.count({ where: { promoted: true, active: true } });

  const candidates = [...byArtistKey.values()];

  const existingArtists = await prisma.artist.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      youtubeUrl: true,
      topTrackUrl: true,
      topTrackName: true,
      latestReleaseName: true,
      latestReleaseDate: true,
      latestReleaseUrl: true,
      coverImageUrl: true,
      sabahConfidence: true,
      sourceTags: true
    }
  });

  const slugSet = new Set(existingArtists.map((a) => a.slug));
  const byName = new Map(existingArtists.map((a) => [normalizeName(a.name), a]));

  let created = 0;
  let updated = 0;
  let unchanged = 0;
  let queuedCandidates = 0;

  for (const item of candidates) {
    const key = normalizeName(item.artistName);
    const current = byName.get(key);
    const confidence = confidenceFor(item.sourceType, item.songTitle);
    const verificationStatus = verificationFromConfidence(confidence);
    const watchUrl = toYoutubeWatchUrl(item.videoId);
    const channelUrl = toYoutubeChannelUrl(item.channelId);
    const sourceTags = `${item.sourceType === "YOUTUBE_CHANNEL" ? "youtube-channel" : "youtube-search"}:${item.channelTitle}${
      item.sourceTerm ? `|term:${item.sourceTerm}` : ""
    }`;

    if (confidence < minStoreConfidence) {
      queuedCandidates += 1;
      if (!dryRun) {
        await prisma.youtubeDiscoveryCandidate.upsert({
          where: { videoId: item.videoId },
          create: {
            sourceType: item.sourceType,
            confidence,
            artistName: item.artistName,
            normalizedName: key,
            channelId: item.channelId,
            channelTitle: item.channelTitle,
            videoId: item.videoId,
            songTitle: item.songTitle,
            publishedAt: item.publishedAt,
            watchUrl,
            thumbnailUrl: item.thumbnailUrl,
            sourceTerm: item.sourceTerm
          },
          update: {
            confidence,
            songTitle: item.songTitle,
            publishedAt: item.publishedAt,
            watchUrl,
            thumbnailUrl: item.thumbnailUrl,
            sourceTerm: item.sourceTerm
          }
        });
      }
      continue;
    }

    if (current) {
      const isNewerThanCurrent =
        !current.latestReleaseDate || item.publishedAt.getTime() > new Date(current.latestReleaseDate).getTime();

      const patch = {
        youtubeUrl: current.youtubeUrl || channelUrl,
        discoverySource: item.sourceType,
        verificationStatus,
        sabahConfidence: Math.max(current.sabahConfidence ?? 0, confidence),
        sourceTags,
        discoveredAt: new Date(),
        hasSongReleased: true,
        topTrackUrl: isNewerThanCurrent ? watchUrl : current.topTrackUrl || watchUrl,
        topTrackName: isNewerThanCurrent ? item.songTitle : current.topTrackName || item.songTitle,
        latestReleaseName: isNewerThanCurrent ? item.songTitle : current.latestReleaseName,
        latestReleaseDate: isNewerThanCurrent ? item.publishedAt : current.latestReleaseDate,
        latestReleaseUrl: isNewerThanCurrent ? watchUrl : current.latestReleaseUrl,
        coverImageUrl: current.coverImageUrl || item.thumbnailUrl || undefined
      };

      const changed =
        patch.youtubeUrl !== current.youtubeUrl ||
        patch.topTrackUrl !== current.topTrackUrl ||
        patch.topTrackName !== current.topTrackName ||
        `${patch.latestReleaseDate ?? ""}` !== `${current.latestReleaseDate ?? ""}` ||
        patch.latestReleaseUrl !== current.latestReleaseUrl ||
        patch.sabahConfidence !== current.sabahConfidence ||
        patch.sourceTags !== current.sourceTags ||
        patch.coverImageUrl !== current.coverImageUrl;

      if (changed) {
        updated += 1;
        if (!dryRun) {
          await prisma.artist.update({ where: { id: current.id }, data: patch });
        }
      } else {
        unchanged += 1;
      }
      continue;
    }

    created += 1;
    if (!dryRun) {
      const slug = createUniqueSlug(item.artistName, slugSet);
      await prisma.artist.create({
        data: {
          slug,
          status: "PENDING",
          type: "NORMAL_LISTING",
          discoverySource: item.sourceType,
          verificationStatus,
          sabahConfidence: confidence,
          sourceTags,
          discoveredAt: new Date(),
          hasSongReleased: true,
          contactWhatsapp: "+601100000000",
          name: item.artistName,
          district: DEFAULT_DISTRICT,
          genres: "Sabah YouTube Discovery",
          bio: `${item.artistName} was discovered from Sabah-focused YouTube sources and is pending editorial verification.`,
          youtubeUrl: channelUrl,
          topTrackUrl: watchUrl,
          topTrackName: item.songTitle,
          latestReleaseName: item.songTitle,
          latestReleaseDate: item.publishedAt,
          latestReleaseUrl: watchUrl,
          coverImageUrl: item.thumbnailUrl,
          featured: false
        }
      });
    }
  }

  return {
    dryRun,
    days,
    minStoreConfidence,
    promoteHitThreshold,
    channelCount: channelSource.size,
    promotedChannelCount: promotedCount,
    searchTerms,
    candidates: candidates.length,
    queuedCandidates,
    created,
    updated,
    unchanged
  };
}
