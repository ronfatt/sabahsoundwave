import { isAdmin } from "@/lib/auth";
import { syncYoutubeArtists } from "@/lib/youtube-sync";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { dryRun?: boolean; days?: number } = {};
  try {
    body = (await request.json()) as { dryRun?: boolean; days?: number };
  } catch {
    // defaults
  }

  try {
    const result = await syncYoutubeArtists({
      dryRun: Boolean(body.dryRun),
      days: body.days
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "YouTube sync failed" },
      { status: 500 }
    );
  }
}
