import { isAdmin } from "@/lib/auth";
import { runOpenAIJson } from "@/lib/ai-assist";
import { getDistrictLabel } from "@/lib/district";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type AutoDecision = {
  decision?: "APPROVE" | "KEEP_PENDING" | "REJECT";
  confidence?: number;
  reason?: string;
};

type ResolvedDecision = {
  decision: "APPROVE" | "KEEP_PENDING" | "REJECT";
  confidence: number;
  reason: string;
};

function hasStrongMusicLink(input: {
  spotifyUrl: string | null;
  appleMusicUrl: string | null;
  youtubeUrl: string | null;
  topTrackUrl: string | null;
}) {
  return Boolean(input.spotifyUrl || input.appleMusicUrl || input.youtubeUrl || input.topTrackUrl);
}

function fallbackDecision(input: {
  hasSongReleased: boolean;
  bio: string;
  genres: string;
  hasLink: boolean;
}): ResolvedDecision {
  const bioLongEnough = input.bio.trim().length >= 50;
  const hasGenreDetail = input.genres.trim().length >= 5;

  if (input.hasSongReleased && input.hasLink && bioLongEnough && hasGenreDetail) {
    return {
      decision: "APPROVE" as const,
      confidence: 0.84,
      reason: "Strong links + complete profile fields."
    };
  }

  return {
    decision: "KEEP_PENDING" as const,
    confidence: 0.6,
    reason: "Not enough confidence for automatic approval."
  };
}

async function aiDecision(input: {
  name: string;
  district: string;
  genres: string;
  bio: string;
  type: "NORMAL_LISTING" | "LAUNCH_SUPPORT";
  hasSongReleased: boolean;
  uploadLinks: string | null;
  spotifyUrl: string | null;
  appleMusicUrl: string | null;
  youtubeUrl: string | null;
  topTrackUrl: string | null;
}): Promise<ResolvedDecision> {
  const prompt = `You are an automated Sabah music submission reviewer.
Return strict JSON only with this exact shape:
{"decision":"APPROVE|KEEP_PENDING|REJECT","confidence":0.0-1.0,"reason":"..."}.
Rules:
- Be conservative to avoid false approval/rejection.
- APPROVE only if evidence is strong and likely Sabah-relevant.
- REJECT only if very high confidence of low-quality/spam/non-compliant.
- KEEP_PENDING for uncertain cases.
- reason max 16 words.
Submission:
${JSON.stringify({
  name: input.name,
  district: getDistrictLabel(input.district),
  genres: input.genres,
  bio: input.bio,
  type: input.type,
  hasSongReleased: input.hasSongReleased,
  uploadLinks: input.uploadLinks,
  spotifyUrl: input.spotifyUrl,
  appleMusicUrl: input.appleMusicUrl,
  youtubeUrl: input.youtubeUrl,
  topTrackUrl: input.topTrackUrl
})}`;

  const ai = (await runOpenAIJson(prompt)) as AutoDecision;
  const decision =
    ai.decision === "APPROVE" || ai.decision === "KEEP_PENDING" || ai.decision === "REJECT"
      ? ai.decision
      : "KEEP_PENDING";
  const confidence =
    typeof ai.confidence === "number" ? Math.max(0, Math.min(1, ai.confidence)) : 0.5;
  const reason =
    typeof ai.reason === "string" && ai.reason.trim() ? ai.reason.trim() : "AI review completed.";

  return { decision, confidence, reason };
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { limit?: number; apply?: boolean } = {};
  try {
    body = (await request.json()) as { limit?: number; apply?: boolean };
  } catch {
    // keep default body
  }

  const limit = Math.max(1, Math.min(200, Number(body.limit) || 80));
  const apply = Boolean(body.apply);

  const pending = await prisma.artist.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: limit
  });

  const results: Array<{
    id: string;
    name: string;
    decision: "APPROVE" | "KEEP_PENDING" | "REJECT";
    confidence: number;
    reason: string;
  }> = [];

  const canUseAi = Boolean(process.env.OPENAI_API_KEY);

  for (const item of pending) {
    const hasLink = hasStrongMusicLink(item);
    let decisionResult: ResolvedDecision = fallbackDecision({
      hasSongReleased: item.hasSongReleased,
      bio: item.bio,
      genres: item.genres,
      hasLink
    });

    if (canUseAi) {
      try {
        decisionResult = await aiDecision(item);
      } catch {
        // fallback is already prepared
      }
    }

    let nextStatus: "PENDING" | "APPROVED" | "REJECTED" = "PENDING";
    if (decisionResult.decision === "APPROVE" && decisionResult.confidence >= 0.82 && hasLink) {
      nextStatus = "APPROVED";
    } else if (decisionResult.decision === "REJECT" && decisionResult.confidence >= 0.92) {
      nextStatus = "REJECTED";
    }

    if (apply && nextStatus !== "PENDING") {
      await prisma.artist.update({
        where: { id: item.id },
        data: {
          status: nextStatus,
          featured: nextStatus === "APPROVED" ? item.featured : false
        }
      });
    }

    results.push({
      id: item.id,
      name: item.name,
      decision: nextStatus === "APPROVED" ? "APPROVE" : nextStatus === "REJECTED" ? "REJECT" : "KEEP_PENDING",
      confidence: decisionResult.confidence,
      reason: decisionResult.reason
    });
  }

  const approved = results.filter((item) => item.decision === "APPROVE").length;
  const rejected = results.filter((item) => item.decision === "REJECT").length;
  const keptPending = results.filter((item) => item.decision === "KEEP_PENDING").length;

  const [submissions, artists] = apply
    ? await Promise.all([
        prisma.artist.findMany({ orderBy: [{ type: "asc" }, { status: "asc" }, { createdAt: "desc" }] }),
        prisma.artist.findMany({ orderBy: [{ status: "asc" }, { featured: "desc" }, { updatedAt: "desc" }] })
      ])
    : [undefined, undefined];

  return NextResponse.json({
    scanned: pending.length,
    approved,
    rejected,
    keptPending,
    apply,
    usedAi: canUseAi,
    preview: results.slice(0, 20),
    submissions,
    artists
  });
}
