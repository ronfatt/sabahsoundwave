import { parseDistrict } from "@/lib/district";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const district = parseDistrict(request.nextUrl.searchParams.get("district"));
  const genre = request.nextUrl.searchParams.get("genre") || undefined;
  const q = request.nextUrl.searchParams.get("q") || undefined;

  const artists = await prisma.artist.findMany({
    where: {
      status: "APPROVED",
      district,
      genres: genre ? { contains: genre } : undefined,
      OR: q
        ? [
            { name: { contains: q } },
            { bio: { contains: q } },
            { genres: { contains: q } }
          ]
        : undefined
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }]
  });

  return NextResponse.json({ artists });
}
