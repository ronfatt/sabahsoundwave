import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const ANALYTICS_SESSION_COOKIE = "ssw_session";

type AnalyticsEventInput = {
  eventType: "PAGE_VIEW" | "ARTIST_CARD_CLICK" | "ARTIST_PROFILE_VIEW" | "SONG_LISTEN_CLICK" | "SONG_SPOTLIGHT_VIEW" | "NEWS_CLICK";
  entityType: "PAGE" | "ARTIST" | "SONG" | "NEWS";
  entityId?: string | null;
  path: string;
  sessionId: string;
  referrer?: string | null;
};

function buildCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  };
}

export function getAnalyticsSessionFromRequest(request: NextRequest) {
  const existing = request.cookies.get(ANALYTICS_SESSION_COOKIE)?.value;
  return {
    sessionId: existing || crypto.randomUUID(),
    isNew: !existing
  };
}

export function attachAnalyticsSession(response: NextResponse, sessionId: string) {
  response.cookies.set(ANALYTICS_SESSION_COOKIE, sessionId, buildCookieOptions());
  return response;
}

export async function getAnalyticsSessionFromCookies() {
  const cookieStore = await cookies();
  return cookieStore.get(ANALYTICS_SESSION_COOKIE)?.value || null;
}

export async function logAnalyticsEvent(input: AnalyticsEventInput) {
  try {
    await prisma.analyticsEvent.create({
      data: {
        eventType: input.eventType,
        entityType: input.entityType,
        entityId: input.entityId || null,
        path: input.path,
        sessionId: input.sessionId,
        referrer: input.referrer || null
      }
    });
  } catch {
    // Keep page render and redirects stable even if analytics schema is not ready yet.
  }
}

