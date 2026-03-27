import { attachAnalyticsSession, getAnalyticsSessionFromRequest, logAnalyticsEvent } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { sessionId, isNew } = getAnalyticsSessionFromRequest(request);

  try {
    const artist = await prisma.artist.findUnique({
      where: { id },
      select: { id: true }
    });

    if (artist) {
      await prisma.artist.update({
        where: { id },
        data: {
          songSpotlightViewCount: { increment: 1 }
        }
      });

      await logAnalyticsEvent({
        eventType: "SONG_SPOTLIGHT_VIEW",
        entityType: "SONG",
        entityId: id,
        path: `/song/${id}`,
        sessionId,
        referrer: request.headers.get("referer")
      });
    }
  } catch {
    // Keep page load stable even if analytics schema is slightly behind.
  }

  const response = NextResponse.json({ ok: true });
  if (isNew) {
    attachAnalyticsSession(response, sessionId);
  }
  return response;
}

