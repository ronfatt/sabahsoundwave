import { isAdmin } from "@/lib/auth";
import { classifyNewsCategory } from "@/lib/news-categories";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [submissions, artists, dropEvents, youtubeCandidates] = await Promise.all([
    prisma.artist.findMany({
      orderBy: [{ type: "asc" }, { status: "asc" }, { createdAt: "desc" }]
    }),
    prisma.artist.findMany({
      orderBy: [{ status: "asc" }, { featured: "desc" }, { updatedAt: "desc" }]
    }),
    prisma.dropEvent.findMany({
      include: {
        artists: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true
          },
          orderBy: { name: "asc" }
        }
      },
      orderBy: { date: "asc" }
    }),
    prisma.youtubeDiscoveryCandidate.findMany({
      where: { status: "NEW" },
      orderBy: [{ confidence: "desc" }, { publishedAt: "desc" }],
      take: 120
    })
  ]);

  let newsItems: Array<{
    id: string;
    title: string;
    url: string;
    source: string | null;
    publishedAt: Date;
    summary: string | null;
    clickCount: number;
    lastClickedAt: Date | null;
  }> = [];
  let newsCategoryCounts: Record<string, number> = {};

  try {
    newsItems = await prisma.newsItem.findMany({
      orderBy: [{ clickCount: "desc" }, { publishedAt: "desc" }],
      take: 40
    });

    newsCategoryCounts = newsItems.reduce<Record<string, number>>((acc, item) => {
      const category = classifyNewsCategory(item.title, item.summary);
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
  } catch {
    newsItems = [];
    newsCategoryCounts = {};
  }

  return NextResponse.json({
    submissions,
    artists,
    dropEvents,
    youtubeCandidates,
    newsItems,
    newsCategoryCounts
  });
}
