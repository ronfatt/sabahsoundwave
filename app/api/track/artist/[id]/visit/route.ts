import { attachAnalyticsSession, getAnalyticsSessionFromRequest, logAnalyticsEvent } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const lang = request.nextUrl.searchParams.get("lang");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.sabahsoundwave.com";
  const { sessionId, isNew } = getAnalyticsSessionFromRequest(request);

  const artist = await prisma.artist.findUnique({
    where: { id },
    select: { slug: true }
  });

  if (!artist?.slug) {
    return NextResponse.redirect(new URL("/", baseUrl));
  }

  try {
    await prisma.artist.update({
      where: { id },
      data: {
        artistCardClickCount: { increment: 1 }
      }
    });
  } catch {
    // Keep redirect working if schema is slightly behind.
  }

  const destination = new URL(`/artists/${artist.slug}`, baseUrl);
  if (lang) destination.searchParams.set("lang", lang);

  await logAnalyticsEvent({
    eventType: "ARTIST_CARD_CLICK",
    entityType: "ARTIST",
    entityId: id,
    path: request.nextUrl.pathname,
    sessionId,
    referrer: request.headers.get("referer")
  });

  const response = NextResponse.redirect(destination, { status: 307 });
  if (isNew) {
    attachAnalyticsSession(response, sessionId);
  }
  return response;
}
