import { Prisma } from "@prisma/client";
import { runOpenAIJson } from "@/lib/ai-assist";
import { prisma } from "@/lib/prisma";

type ParsedNews = {
  title: string;
  url: string;
  source?: string;
  description?: string;
  publishedAt: Date;
};

type ScoredNews = ParsedNews & {
  summary: string;
  score: number;
  include: boolean;
};

const DEFAULT_QUERY_TERMS = [
  "Sabah music",
  "Sabahan artist",
  "Kadazan Dusun song",
  "Borneo music Malaysia"
];

function decodeEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function stripHtml(value: string) {
  return decodeEntities(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " "));
}

function extractTag(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? stripHtml(match[1]) : "";
}

function parseRssItems(xml: string): ParsedNews[] {
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  const parsed: ParsedNews[] = [];

  for (const item of items) {
    const title = extractTag(item, "title");
    const link = extractTag(item, "link");
    const description = extractTag(item, "description");
    const source = extractTag(item, "source");
    const pubDateRaw = extractTag(item, "pubDate");
    const publishedAt = new Date(pubDateRaw || Date.now());

    if (!title || !link || Number.isNaN(publishedAt.getTime())) continue;

    parsed.push({
      title,
      url: link,
      source: source || undefined,
      description: description || undefined,
      publishedAt
    });
  }

  return parsed;
}

function getNewsQueries() {
  const custom = (process.env.NEWS_QUERY_TERMS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return custom.length > 0 ? custom : DEFAULT_QUERY_TERMS;
}

function getGoogleNewsRssUrl(query: string) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-MY&gl=MY&ceid=MY:en`;
}

function fallbackScore(item: ParsedNews) {
  const hay = `${item.title} ${item.description || ""}`.toLowerCase();
  let score = 45;
  if (/(sabah|sabahan|borneo|kadazan|dusun)/.test(hay)) score += 30;
  if (/(music|song|artist|band|release|single|album|festival|concert)/.test(hay)) score += 20;
  return Math.min(100, score);
}

async function scoreAndSummarize(items: ParsedNews[]): Promise<ScoredNews[]> {
  if (items.length === 0) return [];
  if (!process.env.OPENAI_API_KEY) {
    return items.map((item) => {
      const score = fallbackScore(item);
      return {
        ...item,
        score,
        include: score >= 62,
        summary:
          item.description?.slice(0, 160) ||
          "Sabah-related music update detected from global news coverage."
      };
    });
  }

  try {
    const prompt = `You are filtering global news for a Sabah music platform.
Return strict JSON:
{"items":[{"index":0,"include":true,"score":0-100,"summary":"<=25 words"}]}
Rules:
- Include only if clearly relevant to Sabah/Sabahan/Borneo music, artist, release, concert, festival, or music industry movement.
- Score relevance 0-100.
- Summary must be factual, concise, no hype.
Input items: ${JSON.stringify(
      items.map((item, index) => ({
        index,
        title: item.title,
        source: item.source,
        description: item.description
      }))
    )}`;

    const ai = await runOpenAIJson(prompt) as {
      items?: Array<{ index?: number; include?: boolean; score?: number; summary?: string }>;
    };
    const byIndex = new Map<number, { include: boolean; score: number; summary: string }>();
    for (const entry of ai.items || []) {
      if (typeof entry.index !== "number") continue;
      byIndex.set(entry.index, {
        include: Boolean(entry.include),
        score: Math.max(0, Math.min(100, Number(entry.score) || 0)),
        summary: (entry.summary || "").trim()
      });
    }

    return items.map((item, index) => {
      const aiItem = byIndex.get(index);
      const score = aiItem?.score ?? fallbackScore(item);
      return {
        ...item,
        score,
        include: aiItem?.include ?? score >= 62,
        summary: aiItem?.summary || item.description?.slice(0, 160) || "Sabah music related update."
      };
    });
  } catch {
    return items.map((item) => {
      const score = fallbackScore(item);
      return {
        ...item,
        score,
        include: score >= 62,
        summary:
          item.description?.slice(0, 160) ||
          "Sabah-related music update detected from global news coverage."
      };
    });
  }
}

export async function syncSabahMusicNews(options?: { dryRun?: boolean }) {
  const dryRun = Boolean(options?.dryRun);
  const maxPerQuery = Math.max(8, Math.min(40, Number(process.env.NEWS_MAX_PER_QUERY || 15)));
  const maxSave = Math.max(6, Math.min(40, Number(process.env.NEWS_MAX_SAVE || 12)));
  const retentionDays = Math.max(7, Number(process.env.NEWS_RETENTION_DAYS || 45));
  const queries = getNewsQueries();

  const fetched: ParsedNews[] = [];
  for (const query of queries) {
    const url = getGoogleNewsRssUrl(query);
    const response = await fetch(url, { next: { revalidate: 0 } });
    if (!response.ok) continue;
    const xml = await response.text();
    fetched.push(...parseRssItems(xml).slice(0, maxPerQuery));
  }

  const deduped = [...new Map(fetched.map((item) => [item.url, item])).values()].sort(
    (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()
  );
  const scored = await scoreAndSummarize(deduped.slice(0, 80));
  const selected = scored
    .filter((item) => item.include)
    .sort((a, b) => b.score - a.score || b.publishedAt.getTime() - a.publishedAt.getTime())
    .slice(0, maxSave);

  if (!dryRun) {
    try {
      for (const item of selected) {
        await prisma.newsItem.upsert({
          where: { url: item.url },
          create: {
            title: item.title,
            url: item.url,
            source: item.source,
            summary: item.summary,
            publishedAt: item.publishedAt,
            region: "GLOBAL"
          },
          update: {
            title: item.title,
            source: item.source,
            summary: item.summary,
            publishedAt: item.publishedAt
          }
        });
      }

      await prisma.newsItem.deleteMany({
        where: {
          publishedAt: {
            lt: new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
          }
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(
          "NewsItem table is missing. Run `npx prisma db push` locally and apply schema to production DB."
        );
      }
      throw error;
    }
  }

  return {
    dryRun,
    queries,
    fetched: fetched.length,
    deduped: deduped.length,
    selected: selected.length
  };
}

