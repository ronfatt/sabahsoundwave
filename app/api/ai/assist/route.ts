import { isAdmin } from "@/lib/auth";
import { runOpenAIJson } from "@/lib/ai-assist";
import { getDistrictLabel } from "@/lib/district";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bioDraftSchema = z.object({
  name: z.string().trim().min(1),
  district: z.string().trim().min(1),
  genres: z.string().trim().min(1),
  type: z.enum(["normal_listing", "launch_support"]),
  has_song_released: z.enum(["yes", "no"]),
  existingBio: z.string().trim().optional()
});

const triageSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  district: z.string().trim().min(1),
  genres: z.string().trim().min(1),
  bio: z.string().trim().min(1),
  type: z.enum(["NORMAL_LISTING", "LAUNCH_SUPPORT"]),
  hasSongReleased: z.boolean(),
  uploadLinks: z.string().nullable().optional(),
  spotifyUrl: z.string().nullable().optional(),
  appleMusicUrl: z.string().nullable().optional(),
  youtubeUrl: z.string().nullable().optional()
});

const soundFinderSchema = z.object({
  query: z.string().trim().min(4).max(140)
});

const requestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("bio_draft"), payload: bioDraftSchema }),
  z.object({ action: z.literal("submission_triage"), payload: triageSchema }),
  z.object({ action: z.literal("sound_finder"), payload: soundFinderSchema })
]);

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  try {
    if (parsed.data.action === "sound_finder") {
      const payload = parsed.data.payload;
      const candidates = await prisma.artist.findMany({
        where: { status: "APPROVED" },
        select: {
          id: true,
          name: true,
          slug: true,
          district: true,
          genres: true,
          bio: true
        },
        orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
        take: 60
      });

      if (candidates.length === 0) {
        return NextResponse.json({ recommendations: [] });
      }

      const slugSet = new Set(candidates.map((artist) => artist.slug));
      let mapped: Array<{ slug: string; reason: string }> = [];
      try {
        const prompt = `Match a listener vibe query to Sabah artists.\nReturn strict JSON with this shape only:\n{"recommendations":[{"slug":"...","reason":"..."}]}.\nRules: exactly 3 items, reason 10-18 words, specific vibe matching, no emojis.\nQuery: ${payload.query}\nCandidates: ${JSON.stringify(
          candidates.map((artist) => ({
            slug: artist.slug,
            name: artist.name,
            district: getDistrictLabel(artist.district),
            genres: artist.genres,
            bio: artist.bio
          }))
        )}`;
        type FinderResult = { recommendations?: Array<{ slug?: string; reason?: string }> };
        const ai = await runOpenAIJson(prompt) as FinderResult;
        mapped = Array.isArray(ai.recommendations)
          ? ai.recommendations
              .filter((item): item is { slug: string; reason: string } => typeof item.slug === "string" && typeof item.reason === "string")
              .filter((item) => slugSet.has(item.slug))
              .slice(0, 3)
          : [];
      } catch {
        mapped = [];
      }

      const fallbacks = candidates.slice(0, 3).map((artist) => ({
        slug: artist.slug,
        reason: `Matches "${payload.query}" with ${artist.genres.toLowerCase()} from ${getDistrictLabel(artist.district)}.`
      }));

      const chosen = mapped.length === 3 ? mapped : fallbacks;
      const bySlug = new Map(candidates.map((artist) => [artist.slug, artist]));
      const recommendations = chosen
        .map((item) => {
          const artist = bySlug.get(item.slug);
          if (!artist) return null;
          return {
            id: artist.id,
            slug: artist.slug,
            name: artist.name,
            district: getDistrictLabel(artist.district),
            genres: artist.genres,
            reason: item.reason.trim()
          };
        })
        .filter(Boolean);

      return NextResponse.json({ recommendations });
    }

    if (parsed.data.action === "bio_draft") {
      const payload = parsed.data.payload;
      const districtLabel = getDistrictLabel(payload.district);
      const prompt = `Write a short artist bio for a Sabah-only music platform.\nReturn JSON: {"bio":"..."}.\nRules: 55-90 words, clear and natural tone, mention Sabah and district, include genre feel, avoid fake achievements, no hashtags, no emojis.\nInput: ${JSON.stringify({
        name: payload.name,
        district: districtLabel,
        genres: payload.genres,
        type: payload.type,
        has_song_released: payload.has_song_released,
        existing_bio_hint: payload.existingBio || ""
      })}`;

      const ai = await runOpenAIJson(prompt) as { bio?: unknown };
      const bio = typeof ai.bio === "string" ? ai.bio.trim() : "";

      if (!bio) {
        return NextResponse.json({ error: "AI did not return a valid bio" }, { status: 502 });
      }

      return NextResponse.json({ bio });
    }

    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = parsed.data.payload;
    const districtLabel = getDistrictLabel(payload.district);

    const prompt = `You are helping admin pre-screen a Sabah music submission.\nReturn strict JSON with this exact shape:\n{"recommendedPackage":"Starter|Pro|Label","tags":["资料不全|链接异常|可直接上架|需人工跟进"],"reason":"one short sentence"}.\nRules:\n- Choose one recommendedPackage only.\n- tags should be 1 to 3 items from the allowed set.\n- reason max 25 words.\n- Be conservative; do not auto-approve.\nSubmission: ${JSON.stringify({
      name: payload.name,
      district: districtLabel,
      genres: payload.genres,
      bio: payload.bio,
      type: payload.type,
      hasSongReleased: payload.hasSongReleased,
      uploadLinks: payload.uploadLinks,
      spotifyUrl: payload.spotifyUrl,
      appleMusicUrl: payload.appleMusicUrl,
      youtubeUrl: payload.youtubeUrl
    })}`;

    const ai = await runOpenAIJson(prompt) as {
      recommendedPackage?: string;
      tags?: unknown;
      reason?: string;
    };

    const recommendedPackage =
      ai.recommendedPackage === "Starter" || ai.recommendedPackage === "Pro" || ai.recommendedPackage === "Label"
        ? ai.recommendedPackage
        : "Starter";

    const allowedTags = new Set(["资料不全", "链接异常", "可直接上架", "需人工跟进"]);
    const tags = Array.isArray(ai.tags)
      ? ai.tags.filter((tag): tag is string => typeof tag === "string" && allowedTags.has(tag)).slice(0, 3)
      : ["需人工跟进"];

    const reason = typeof ai.reason === "string" && ai.reason.trim().length > 0 ? ai.reason.trim() : "建议人工复核资料完整度";

    return NextResponse.json({ recommendedPackage, tags, reason });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI request failed" },
      { status: 500 }
    );
  }
}
