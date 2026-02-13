import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createDropEventSchema = z.object({
  title: z.string().trim().min(2).max(140),
  date: z.string().datetime(),
  description: z.string().trim().min(10).max(1200),
  artistIds: z.array(z.string().trim().min(1)).min(1)
});

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createDropEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
  }

  const data = parsed.data;

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

  const event = await prisma.dropEvent.create({
    data: {
      title: data.title,
      date: new Date(data.date),
      description: data.description,
      artists: {
        connect: data.artistIds.map((id) => ({ id }))
      }
    },
    include: {
      artists: {
        select: { id: true, name: true, slug: true, status: true },
        orderBy: { name: "asc" }
      }
    }
  });

  return NextResponse.json({ event }, { status: 201 });
}
