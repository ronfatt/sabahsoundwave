import { isAdmin } from "@/lib/auth";
import { enrichSpotifyArtists } from "@/lib/spotify-enrich";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { limit?: number; pendingOnly?: boolean; dryRun?: boolean } = {};
  try {
    body = (await request.json()) as { limit?: number; pendingOnly?: boolean; dryRun?: boolean };
  } catch {
    // use defaults
  }

  const limit = Math.max(1, Math.min(120, Number(body.limit) || 60));
  const pendingOnly = Boolean(body.pendingOnly);
  const dryRun = Boolean(body.dryRun);

  try {
    const result = await enrichSpotifyArtists({ limit, pendingOnly, dryRun });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Spotify sync failed" },
      { status: 500 }
    );
  }
}
