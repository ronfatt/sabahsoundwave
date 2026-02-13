import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const action = body.action as "approve" | "reject";

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const existing = await prisma.artist.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  const nextStatus = action === "approve" ? "APPROVED" : "REJECTED";
  await prisma.artist.update({
    where: { id },
    data: {
      status: nextStatus,
      featured: nextStatus === "APPROVED" ? existing.featured : false
    }
  });

  const [submissions, artists] = await Promise.all([
    prisma.artist.findMany({ orderBy: [{ type: "asc" }, { status: "asc" }, { createdAt: "desc" }] }),
    prisma.artist.findMany({ orderBy: [{ status: "asc" }, { featured: "desc" }, { updatedAt: "desc" }] })
  ]);

  return NextResponse.json({ submissions, artists });
}
