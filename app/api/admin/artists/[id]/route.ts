import { isAdmin } from "@/lib/auth";
import { createUniqueSlug } from "@/lib/slug";
import { cleanOptional, artistUpdateSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = artistUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const data = parsed.data;

  const current = await prisma.artist.findUnique({ where: { id } });
  if (!current) {
    return NextResponse.json({ error: "Artist not found" }, { status: 404 });
  }

  let slug = current.slug;
  if (data.name.trim() !== current.name) {
    const existing = await prisma.artist.findMany({
      where: { id: { not: id } },
      select: { slug: true }
    });
    slug = createUniqueSlug(data.name, new Set(existing.map((item) => item.slug)));
  }

  const artist = await prisma.artist.update({
    where: { id },
    data: {
      slug,
      type: data.type,
      hasSongReleased: data.hasSongReleased,
      uploadLinks: cleanOptional(data.uploadLinks),
      contactWhatsapp: data.contactWhatsapp.trim(),
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
      featured: data.featured
    }
  });

  return NextResponse.json({ artist });
}
