import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const inputPassword = String(body?.password ?? "").trim();
  const adminPassword = (process.env.ADMIN_PASSWORD || "").trim();

  if (!adminPassword || inputPassword !== adminPassword) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const host = request.headers.get("host") || "";
  const isSabahDomain =
    process.env.NODE_ENV === "production" &&
    (host === "sabahsoundwave.com" ||
      host === "www.sabahsoundwave.com" ||
      host.endsWith(".sabahsoundwave.com"));

  const response = NextResponse.json({ ok: true });
  response.cookies.set("admin_token", adminPassword, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8,
    path: "/",
    ...(isSabahDomain ? { domain: ".sabahsoundwave.com" } : {})
  });

  return response;
}
