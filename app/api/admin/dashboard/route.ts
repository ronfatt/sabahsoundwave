import { isAdmin } from "@/lib/auth";
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

  return NextResponse.json({ submissions, artists, dropEvents, youtubeCandidates });
}
