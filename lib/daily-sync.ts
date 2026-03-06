import { discoverSpotifyArtists } from "@/lib/spotify-discover";
import { enrichSpotifyArtists } from "@/lib/spotify-enrich";
import { syncYoutubeArtists } from "@/lib/youtube-sync";
import { syncSabahMusicNews } from "@/lib/news-sync";

export async function runDailySync() {
  const target = Math.max(100, Number(process.env.SPOTIFY_DISCOVERY_TARGET || 220));
  const syncLimit = Math.max(60, Number(process.env.SPOTIFY_SYNC_DAILY_LIMIT || 180));
  const youtubeDays = Math.max(7, Number(process.env.YOUTUBE_SYNC_DAYS || 30));

  const [discoverResult, enrichResult, youtubeResult] = await Promise.all([
    discoverSpotifyArtists({ target, dryRun: false }),
    enrichSpotifyArtists({ limit: syncLimit, pendingOnly: false, dryRun: false }),
    syncYoutubeArtists({ dryRun: false, days: youtubeDays })
  ]);

  let news: { ok: boolean; result?: unknown; error?: string } = { ok: true };
  try {
    news = { ok: true, result: await syncSabahMusicNews({ dryRun: false }) };
  } catch (error) {
    news = {
      ok: false,
      error: error instanceof Error ? error.message : "News sync failed"
    };
  }

  return {
    ok: true,
    ranAt: new Date().toISOString(),
    discover: discoverResult,
    enrich: enrichResult,
    youtube: youtubeResult,
    news
  };
}
