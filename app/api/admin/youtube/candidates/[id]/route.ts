import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createUniqueSlug } from "@/lib/slug";
import { NextRequest, NextResponse } from "next/server";

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { action?: "approve" | "dismiss" };
  const action = body.action;

  if (action !== "approve" && action !== "dismiss") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const candidate = await prisma.youtubeDiscoveryCandidate.findUnique({ where: { id } });
  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  if (action === "dismiss") {
    await prisma.youtubeDiscoveryCandidate.update({
      where: { id },
      data: { status: "DISMISSED" }
    });

    const youtubeCandidates = await prisma.youtubeDiscoveryCandidate.findMany({
      where: { status: "NEW" },
      orderBy: [{ confidence: "desc" }, { publishedAt: "desc" }],
      take: 120
    });

    return NextResponse.json({ ok: true, youtubeCandidates });
  }

  const normalized = normalizeName(candidate.artistName);
  const artists = await prisma.artist.findMany({
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

  const existing = artists.find((artist) => normalizeName(artist.name) === normalized);
  const verificationStatus = candidate.confidence >= 88 ? "AUTO_APPROVED" : "NEEDS_REVIEW";

  if (existing) {
    const isNewer = !existing.latestReleaseDate || candidate.publishedAt.getTime() > new Date(existing.latestReleaseDate).getTime();
    await prisma.artist.update({
      where: { id: existing.id },
      data: {
        discoverySource: candidate.sourceType,
        verificationStatus,
        sabahConfidence: Math.max(existing.sabahConfidence ?? 0, candidate.confidence),
        sourceTags: candidate.sourceTerm
          ? `youtube-review:${candidate.channelTitle}|term:${candidate.sourceTerm}`
          : `youtube-review:${candidate.channelTitle}`,
        discoveredAt: new Date(),
        hasSongReleased: true,
        youtubeUrl: existing.youtubeUrl || `https://www.youtube.com/channel/${candidate.channelId}`,
        topTrackUrl: isNewer ? candidate.watchUrl : existing.topTrackUrl || candidate.watchUrl,
        topTrackName: isNewer ? candidate.songTitle : existing.topTrackName || candidate.songTitle,
        latestReleaseName: isNewer ? candidate.songTitle : existing.latestReleaseName,
        latestReleaseDate: isNewer ? candidate.publishedAt : existing.latestReleaseDate,
        latestReleaseUrl: isNewer ? candidate.watchUrl : existing.latestReleaseUrl,
        coverImageUrl: existing.coverImageUrl || candidate.thumbnailUrl || undefined
      }
    });
  } else {
    const slug = createUniqueSlug(candidate.artistName, new Set(artists.map((item) => item.slug)));
    await prisma.artist.create({
      data: {
        slug,
        status: "PENDING",
        type: "NORMAL_LISTING",
        discoverySource: candidate.sourceType,
        verificationStatus,
        sabahConfidence: candidate.confidence,
        sourceTags: candidate.sourceTerm
          ? `youtube-review:${candidate.channelTitle}|term:${candidate.sourceTerm}`
          : `youtube-review:${candidate.channelTitle}`,
        discoveredAt: new Date(),
        hasSongReleased: true,
        contactWhatsapp: "+601100000000",
        name: candidate.artistName,
        district: "KOTA_KINABALU",
        genres: "Sabah YouTube Discovery",
        bio: `${candidate.artistName} was approved from YouTube discovery candidate queue and is pending editorial verification.`,
        youtubeUrl: `https://www.youtube.com/channel/${candidate.channelId}`,
        topTrackUrl: candidate.watchUrl,
        topTrackName: candidate.songTitle,
        latestReleaseName: candidate.songTitle,
        latestReleaseDate: candidate.publishedAt,
        latestReleaseUrl: candidate.watchUrl,
        coverImageUrl: candidate.thumbnailUrl,
        featured: false
      }
    });
  }

  await prisma.youtubeDiscoveryCandidate.update({
    where: { id },
    data: { status: "REVIEWED" }
  });

  const [youtubeCandidates, updatedArtists, updatedSubmissions] = await Promise.all([
    prisma.youtubeDiscoveryCandidate.findMany({
      where: { status: "NEW" },
      orderBy: [{ confidence: "desc" }, { publishedAt: "desc" }],
      take: 120
    }),
    prisma.artist.findMany({
      orderBy: [{ status: "asc" }, { featured: "desc" }, { updatedAt: "desc" }]
    }),
    prisma.artist.findMany({
      orderBy: [{ type: "asc" }, { status: "asc" }, { createdAt: "desc" }]
    })
  ]);

  return NextResponse.json({ ok: true, youtubeCandidates, artists: updatedArtists, submissions: updatedSubmissions });
}
