import { isAdmin } from "@/lib/auth";
import { getDistrictLabel } from "@/lib/district";
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

const requestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("bio_draft"), payload: bioDraftSchema }),
  z.object({ action: z.literal("submission_triage"), payload: triageSchema })
]);

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [k: string]: JsonValue };

async function runOpenAIJson(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are an assistant for Sabah Soundwave. Always return strict JSON with no markdown fences and no extra text."
        },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI request failed: ${detail}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("AI returned empty content");
  }

  return JSON.parse(content) as JsonValue;
}

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

      const ai = await runOpenAIJson(prompt);
      const bio = typeof (ai as { bio?: JsonValue }).bio === "string" ? (ai as { bio: string }).bio.trim() : "";

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
