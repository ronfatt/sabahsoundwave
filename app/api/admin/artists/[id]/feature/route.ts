import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const featureSchema = z.object({ featured: z.boolean() });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = featureSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid feature flag" }, { status: 400 });
  }

  const current = await prisma.artist.findUnique({ where: { id } });
  if (!current) {
    return NextResponse.json({ error: "Artist not found" }, { status: 404 });
  }

  if (current.status !== "APPROVED") {
    return NextResponse.json({ error: "Only approved artists can be featured" }, { status: 400 });
  }

  const artist = await prisma.artist.update({
    where: { id },
    data: { featured: parsed.data.featured }
  });

  return NextResponse.json({ artist });
}
