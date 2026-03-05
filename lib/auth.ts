import { NextRequest } from "next/server";

export function isAdmin(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cookieToken = request.cookies.get("admin_token")?.value;
  const headerToken = authHeader?.replace("Bearer ", "").trim();
  const token = (headerToken || cookieToken || "").trim();
  const adminPassword = (process.env.ADMIN_PASSWORD || "").trim();

  if (!token || !adminPassword) return false;
  return token === adminPassword;
}
