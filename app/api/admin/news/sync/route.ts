import { isAdmin } from "@/lib/auth";
import { syncSabahMusicNews } from "@/lib/news-sync";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { dryRun?: boolean } = {};
  try {
    body = (await request.json()) as { dryRun?: boolean };
  } catch {
    // defaults
  }

  try {
    const result = await syncSabahMusicNews({ dryRun: Boolean(body.dryRun) });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "News sync failed" },
      { status: 500 }
    );
  }
}

