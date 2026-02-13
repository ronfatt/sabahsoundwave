import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateDropEventSchema = z.object({
  title: z.string().trim().min(2).max(140),
  date: z.string().datetime(),
  description: z.string().trim().min(10).max(1200),
  artistIds: z.array(z.string().trim().min(1)).min(1)
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateDropEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
  }

  const data = parsed.data;
  const existing = await prisma.dropEvent.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    return NextResponse.json({ error: "Drop Day not found" }, { status: 404 });
  }

  const artists = await prisma.artist.findMany({
    where: {
      id: { in: data.artistIds },
      status: "APPROVED"
    },
    select: { id: true }
  });

  if (artists.length !== data.artistIds.length) {
    return NextResponse.json({ error: "Only approved artists can be assigned to a Drop Day" }, { status: 400 });
  }

  const event = await prisma.dropEvent.update({
    where: { id },
    data: {
      title: data.title,
      date: new Date(data.date),
      description: data.description,
      artists: {
        set: data.artistIds.map((artistId) => ({ id: artistId }))
      }
    },
    include: {
      artists: {
        select: { id: true, name: true, slug: true, status: true },
        orderBy: { name: "asc" }
      }
    }
  });

  return NextResponse.json({ event });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.dropEvent.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    return NextResponse.json({ error: "Drop Day not found" }, { status: 404 });
  }

  await prisma.dropEvent.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
