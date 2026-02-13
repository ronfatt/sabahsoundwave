import { prisma } from "@/lib/prisma";
import { createUniqueSlug } from "@/lib/slug";
import { cleanOptional, submissionSchema, toListingType } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = submissionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid submission" }, { status: 400 });
  }

  const data = parsed.data;

  const existing = await prisma.artist.findMany({ select: { slug: true } });

  const submission = await prisma.artist.create({
    data: {
      slug: createUniqueSlug(
        data.name,
        new Set(existing.map((item) => item.slug))
      ),
      status: "PENDING",
      type: toListingType(data.type),
      hasSongReleased: data.has_song_released === "yes",
      uploadLinks: cleanOptional(data.upload_links),
      contactWhatsapp: data.contact_whatsapp.trim(),
      name: data.name,
      district: data.district,
      genres: data.genres,
      bio: data.bio,
      aiSummary: cleanOptional(data.aiSummary),
      topTrackUrl: cleanOptional(data.topTrackUrl),
      spotifyUrl: cleanOptional(data.spotifyUrl),
      appleMusicUrl: cleanOptional(data.appleMusicUrl),
      youtubeUrl: cleanOptional(data.youtubeUrl),
      coverImageUrl: cleanOptional(data.coverImageUrl),
      featured: false
    }
  });

  return NextResponse.json({ submission }, { status: 201 });
}
