import { attachAnalyticsSession, getAnalyticsSessionFromRequest, logAnalyticsEvent } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

function pickListenUrl(
  artist: {
    topTrackUrl: string | null;
    latestReleaseUrl: string | null;
    spotifyUrl: string | null;
    appleMusicUrl: string | null;
    youtubeUrl: string | null;
  },
  target: string | null
) {
  if (target === "spotify" && artist.spotifyUrl) return artist.spotifyUrl;
  if (target === "apple" && artist.appleMusicUrl) return artist.appleMusicUrl;
  if (target === "youtube" && artist.youtubeUrl) return artist.youtubeUrl;
  if (target === "latest" && artist.latestReleaseUrl) return artist.latestReleaseUrl;
  if (target === "top" && artist.topTrackUrl) return artist.topTrackUrl;

  return (
    artist.topTrackUrl ||
    artist.latestReleaseUrl ||
    artist.spotifyUrl ||
    artist.appleMusicUrl ||
    artist.youtubeUrl
  );
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const target = request.nextUrl.searchParams.get("target");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.sabahsoundwave.com";
  const { sessionId, isNew } = getAnalyticsSessionFromRequest(request);

  const artist = await prisma.artist.findUnique({
    where: { id },
    select: {
      topTrackUrl: true,
      latestReleaseUrl: true,
      spotifyUrl: true,
      appleMusicUrl: true,
      youtubeUrl: true
    }
  });

  if (!artist) {
    return NextResponse.redirect(new URL("/", baseUrl));
  }

  const listenUrl = pickListenUrl(artist, target);
  if (!listenUrl) {
    return NextResponse.redirect(new URL("/", baseUrl));
  }

  try {
    await prisma.artist.update({
      where: { id },
      data: {
        songListenClickCount: { increment: 1 }
      }
    });
  } catch {
    // Keep redirect working if schema is slightly behind.
  }

  await logAnalyticsEvent({
    eventType: "SONG_LISTEN_CLICK",
    entityType: "SONG",
    entityId: id,
    path: request.nextUrl.pathname,
    sessionId,
    referrer: request.headers.get("referer")
  });

  const response = NextResponse.redirect(listenUrl, { status: 307 });
  if (isNew) {
    attachAnalyticsSession(response, sessionId);
  }
  return response;
}
