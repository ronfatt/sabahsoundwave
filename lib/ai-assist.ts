import { getDistrictLabel } from "@/lib/district";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [k: string]: JsonValue };

const signatureCache = new Map<string, string>();
const dailyReasonCache = new Map<string, string>();

function cleanSentence(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export async function runOpenAIJson(prompt: string) {
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

export async function getArtistSoundSignature(input: {
  id: string;
  name: string;
  district: string;
  genres: string;
  bio: string;
}) {
  const cacheKey = `${input.id}:${input.bio}`;
  if (signatureCache.has(cacheKey)) {
    return signatureCache.get(cacheKey)!;
  }

  const districtLabel = getDistrictLabel(input.district);
  const fallback = cleanSentence(
    `${input.genres} rooted in ${districtLabel}, blending Sabah mood with expressive local storytelling.`
  );

  try {
    const prompt = `Write one short "AI Sound Signature" sentence for a Sabah artist profile.\nReturn JSON: {"signature":"..."}.\nRules: 10-18 words, no emojis, no hashtags, specific vibe language.\nInput: ${JSON.stringify({
      name: input.name,
      district: districtLabel,
      genres: input.genres,
      bio: input.bio
    })}`;

    const ai = await runOpenAIJson(prompt);
    const signature =
      typeof (ai as { signature?: JsonValue }).signature === "string"
        ? cleanSentence((ai as { signature: string }).signature)
        : fallback;
    signatureCache.set(cacheKey, signature || fallback);
    return signature || fallback;
  } catch {
    signatureCache.set(cacheKey, fallback);
    return fallback;
  }
}

export async function getDailyPickReason(input: {
  dateKey: string;
  name: string;
  district: string;
  genres: string;
  bio: string;
}) {
  if (dailyReasonCache.has(input.dateKey)) {
    return dailyReasonCache.get(input.dateKey)!;
  }

  const districtLabel = getDistrictLabel(input.district);
  const fallback = cleanSentence(
    `Blends ${input.genres.toLowerCase()} with ${districtLabel} atmosphere for immersive Sabah listening sessions.`
  );

  try {
    const prompt = `Write one reason sentence for "Daily AI Pick" on Sabah Soundwave.\nReturn JSON: {"reason":"..."}.\nRules: 12-20 words, concise, no emojis, no markdown.\nInput: ${JSON.stringify({
      name: input.name,
      district: districtLabel,
      genres: input.genres,
      bio: input.bio
    })}`;
    const ai = await runOpenAIJson(prompt);
    const reason =
      typeof (ai as { reason?: JsonValue }).reason === "string"
        ? cleanSentence((ai as { reason: string }).reason)
        : fallback;
    dailyReasonCache.set(input.dateKey, reason || fallback);
    return reason || fallback;
  } catch {
    dailyReasonCache.set(input.dateKey, fallback);
    return fallback;
  }
}
