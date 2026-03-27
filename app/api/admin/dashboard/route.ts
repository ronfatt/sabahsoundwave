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
  let trafficOverview = {
    totalPageViews: 0,
    uniqueVisitors: 0,
    pageViews7d: 0,
    uniqueVisitors7d: 0
  };
  let engagementOverview = {
    artistCardClicks: 0,
    artistProfileViews: 0,
    songListenClicks: 0,
    songSpotlightViews: 0,
    newsClicks: 0
  };
  let topPages: Array<{ path: string; views: number }> = [];
  let visitorTrend14d: Array<{
    date: string;
    label: string;
    pageViews: number;
    uniqueVisitors: number;
  }> = [];
  let topArtists7d: Array<{
    id: string;
    name: string;
    slug: string;
    district: string;
    profileViews: number;
    cardClicks: number;
    totalInteractions: number;
  }> = [];
  let trendingSongs7d: Array<{
    id: string;
    name: string;
    slug: string;
    district: string;
    topTrackName: string | null;
    latestReleaseName: string | null;
    clicks: number;
    spotlightViews: number;
    totalInteractions: number;
  }> = [];

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

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const [
      totalPageViews,
      pageViews7d,
      uniqueVisitorRows,
      uniqueVisitorRows7d,
      topPageRows,
      trendingSongRows,
      songSpotlightRows,
      topArtistRows,
      artistCardRows,
      pageViewEvents14d,
      artistAggregates,
      newsAggregates
    ] = await Promise.all([
      prisma.analyticsEvent.count({ where: { eventType: "PAGE_VIEW" } }),
      prisma.analyticsEvent.count({ where: { eventType: "PAGE_VIEW", createdAt: { gte: sevenDaysAgo } } }),
      prisma.analyticsEvent.findMany({ where: { eventType: "PAGE_VIEW" }, distinct: ["sessionId"], select: { sessionId: true } }),
      prisma.analyticsEvent.findMany({
        where: { eventType: "PAGE_VIEW", createdAt: { gte: sevenDaysAgo } },
        distinct: ["sessionId"],
        select: { sessionId: true }
      }),
      prisma.analyticsEvent.groupBy({
        by: ["path"],
        where: { eventType: "PAGE_VIEW" },
        _count: { path: true },
        orderBy: { _count: { path: "desc" } },
        take: 8
      }),
      prisma.analyticsEvent.groupBy({
        by: ["entityId"],
        where: {
          eventType: "SONG_LISTEN_CLICK",
          entityType: "SONG",
          entityId: { not: null },
          createdAt: { gte: sevenDaysAgo }
        },
        _count: { entityId: true },
        orderBy: { _count: { entityId: "desc" } },
        take: 8
      }),
      prisma.analyticsEvent.groupBy({
        by: ["entityId"],
        where: {
          eventType: "SONG_SPOTLIGHT_VIEW",
          entityType: "SONG",
          entityId: { not: null },
          createdAt: { gte: sevenDaysAgo }
        },
        _count: { entityId: true },
        orderBy: { _count: { entityId: "desc" } },
        take: 20
      }),
      prisma.analyticsEvent.groupBy({
        by: ["entityId"],
        where: {
          eventType: "ARTIST_PROFILE_VIEW",
          entityType: "ARTIST",
          entityId: { not: null },
          createdAt: { gte: sevenDaysAgo }
        },
        _count: { entityId: true },
        orderBy: { _count: { entityId: "desc" } },
        take: 10
      }),
      prisma.analyticsEvent.groupBy({
        by: ["entityId"],
        where: {
          eventType: "ARTIST_CARD_CLICK",
          entityType: "ARTIST",
          entityId: { not: null },
          createdAt: { gte: sevenDaysAgo }
        },
        _count: { entityId: true },
        orderBy: { _count: { entityId: "desc" } },
        take: 20
      }),
      prisma.analyticsEvent.findMany({
        where: {
          eventType: "PAGE_VIEW",
          createdAt: { gte: fourteenDaysAgo }
        },
        select: {
          createdAt: true,
          sessionId: true
        },
        orderBy: { createdAt: "asc" }
      }),
      prisma.artist.aggregate({
        _sum: {
          artistCardClickCount: true,
          profileViewCount: true,
          songListenClickCount: true,
          songSpotlightViewCount: true
        }
      }),
      prisma.newsItem.aggregate({
        _sum: {
          clickCount: true
        }
      })
    ]);

    const songSpotlightMap = new Map(
      songSpotlightRows
        .filter((item): item is typeof item & { entityId: string } => Boolean(item.entityId))
        .map((item) => [item.entityId, item._count.entityId])
    );

    const artistCardMap = new Map(
      artistCardRows
        .filter((item): item is typeof item & { entityId: string } => Boolean(item.entityId))
        .map((item) => [item.entityId, item._count.entityId])
    );

    const trendingSongIds = Array.from(
      new Set(
        [...trendingSongRows, ...songSpotlightRows]
          .map((item) => item.entityId)
          .filter((id): id is string => Boolean(id))
      )
    );
    const topArtistIds = Array.from(
      new Set(
        [...topArtistRows, ...artistCardRows]
          .map((item) => item.entityId)
          .filter((id): id is string => Boolean(id))
      )
    );

    const trendingArtists = trendingSongIds.length
      ? await prisma.artist.findMany({
          where: { id: { in: trendingSongIds } },
          select: {
            id: true,
            name: true,
            slug: true,
            district: true,
            topTrackName: true,
            latestReleaseName: true
          }
        })
      : [];
    const trendingArtistMap = new Map(trendingArtists.map((artist) => [artist.id, artist]));

    const topArtists = topArtistIds.length
      ? await prisma.artist.findMany({
          where: { id: { in: topArtistIds } },
          select: {
            id: true,
            name: true,
            slug: true,
            district: true
          }
        })
      : [];
    const topArtistMap = new Map(topArtists.map((artist) => [artist.id, artist]));

    trafficOverview = {
      totalPageViews,
      uniqueVisitors: uniqueVisitorRows.length,
      pageViews7d,
      uniqueVisitors7d: uniqueVisitorRows7d.length
    };

    engagementOverview = {
      artistCardClicks: artistAggregates._sum.artistCardClickCount ?? 0,
      artistProfileViews: artistAggregates._sum.profileViewCount ?? 0,
      songListenClicks: artistAggregates._sum.songListenClickCount ?? 0,
      songSpotlightViews: artistAggregates._sum.songSpotlightViewCount ?? 0,
      newsClicks: newsAggregates._sum.clickCount ?? 0
    };

    topPages = topPageRows.map((row) => ({
      path: row.path,
      views: row._count.path
    }));

    const dailyTrendMap = new Map<
      string,
      { pageViews: number; sessions: Set<string> }
    >();

    for (let offset = 13; offset >= 0; offset -= 1) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - offset);
      const key = date.toISOString().slice(0, 10);
      dailyTrendMap.set(key, { pageViews: 0, sessions: new Set<string>() });
    }

    for (const event of pageViewEvents14d) {
      const key = event.createdAt.toISOString().slice(0, 10);
      const bucket = dailyTrendMap.get(key);
      if (!bucket) continue;
      bucket.pageViews += 1;
      bucket.sessions.add(event.sessionId);
    }

    visitorTrend14d = Array.from(dailyTrendMap.entries()).map(([date, stats]) => {
      const dateValue = new Date(`${date}T00:00:00.000Z`);
      return {
        date,
        label: dateValue.toLocaleDateString("en-MY", { month: "short", day: "numeric" }),
        pageViews: stats.pageViews,
        uniqueVisitors: stats.sessions.size
      };
    });

    topArtists7d = topArtistRows
      .map((row) => {
        const artist = row.entityId ? topArtistMap.get(row.entityId) : null;
        if (!artist) return null;
        const cardClicks = artistCardMap.get(artist.id) ?? 0;
        return {
          id: artist.id,
          name: artist.name,
          slug: artist.slug,
          district: artist.district,
          profileViews: row._count.entityId,
          cardClicks,
          totalInteractions: row._count.entityId + cardClicks
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => b.totalInteractions - a.totalInteractions || b.profileViews - a.profileViews)
      .slice(0, 8);

    trendingSongs7d = trendingSongRows
      .map((row) => {
        const artist = row.entityId ? trendingArtistMap.get(row.entityId) : null;
        const spotlightViews = row.entityId ? songSpotlightMap.get(row.entityId) ?? 0 : 0;
        if (!artist) return null;
        return {
          id: artist.id,
          name: artist.name,
          slug: artist.slug,
          district: artist.district,
          topTrackName: artist.topTrackName,
          latestReleaseName: artist.latestReleaseName,
          clicks: row._count.entityId,
          spotlightViews,
          totalInteractions: row._count.entityId + spotlightViews
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => b.totalInteractions - a.totalInteractions || b.clicks - a.clicks)
      .slice(0, 8);
  } catch {
    trafficOverview = {
      totalPageViews: 0,
      uniqueVisitors: 0,
      pageViews7d: 0,
      uniqueVisitors7d: 0
    };
    engagementOverview = {
      artistCardClicks: 0,
      artistProfileViews: 0,
      songListenClicks: 0,
      songSpotlightViews: 0,
      newsClicks: 0
    };
    topPages = [];
    visitorTrend14d = [];
    topArtists7d = [];
    trendingSongs7d = [];
  }

  return NextResponse.json({
    submissions,
    artists,
    dropEvents,
    youtubeCandidates,
    newsItems,
    newsCategoryCounts,
    trafficOverview,
    engagementOverview,
    topPages,
    visitorTrend14d,
    topArtists7d,
    trendingSongs7d
  });
}
