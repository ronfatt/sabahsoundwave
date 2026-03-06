import { discoverSpotifyArtists } from "@/lib/spotify-discover";
import { enrichSpotifyArtists } from "@/lib/spotify-enrich";
import { syncYoutubeArtists } from "@/lib/youtube-sync";
import { NextRequest, NextResponse } from "next/server";

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const auth = request.headers.get("authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const headerSecret = request.headers.get("x-cron-secret")?.trim() || "";

  return bearer === secret || headerSecret === secret;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const target = Math.max(100, Number(process.env.SPOTIFY_DISCOVERY_TARGET || 220));
  const syncLimit = Math.max(60, Number(process.env.SPOTIFY_SYNC_DAILY_LIMIT || 180));
  const youtubeDays = Math.max(7, Number(process.env.YOUTUBE_SYNC_DAYS || 30));

  try {
    const [discoverResult, enrichResult, youtubeResult] = await Promise.all([
      discoverSpotifyArtists({ target, dryRun: false }),
      enrichSpotifyArtists({ limit: syncLimit, pendingOnly: false, dryRun: false }),
      syncYoutubeArtists({ dryRun: false, days: youtubeDays })
    ]);

    return NextResponse.json({
      ok: true,
      ranAt: new Date().toISOString(),
      discover: discoverResult,
      enrich: enrichResult,
      youtube: youtubeResult
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Daily spotify job failed" },
      { status: 500 }
    );
  }
}
