import { attachAnalyticsSession, getAnalyticsSessionFromRequest, logAnalyticsEvent } from "@/lib/analytics";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  const rawPath = typeof payload?.path === "string" ? payload.path : "/";
  const path = rawPath.startsWith("/") ? rawPath.slice(0, 240) : "/";
  const referrer = request.headers.get("referer");
  const { sessionId, isNew } = getAnalyticsSessionFromRequest(request);

  await logAnalyticsEvent({
    eventType: "PAGE_VIEW",
    entityType: "PAGE",
    path,
    sessionId,
    referrer
  });

  const response = NextResponse.json({ ok: true });
  if (isNew) {
    attachAnalyticsSession(response, sessionId);
  }
  return response;
}

