import { attachAnalyticsSession, getAnalyticsSessionFromRequest, logAnalyticsEvent } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { sessionId, isNew } = getAnalyticsSessionFromRequest(request);

  const item = await prisma.newsItem.findUnique({
    where: { id },
    select: { url: true }
  });

  if (!item?.url) {
    return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL || "https://www.sabahsoundwave.com"));
  }

  try {
    await prisma.newsItem.update({
      where: { id },
      data: {
        clickCount: { increment: 1 },
        lastClickedAt: new Date()
      }
    });
  } catch {
    // If production schema is slightly behind, keep the redirect working.
  }

  await logAnalyticsEvent({
    eventType: "NEWS_CLICK",
    entityType: "NEWS",
    entityId: id,
    path: request.nextUrl.pathname,
    sessionId,
    referrer: request.headers.get("referer")
  });

  const response = NextResponse.redirect(item.url, { status: 307 });
  if (isNew) {
    attachAnalyticsSession(response, sessionId);
  }
  return response;
}
