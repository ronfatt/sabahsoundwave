import { NextRequest } from "next/server";

export function isAdmin(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cookieToken = request.cookies.get("admin_token")?.value;
  const headerToken = authHeader?.replace("Bearer ", "").trim();
  const token = headerToken || cookieToken;

  if (!token || !process.env.ADMIN_PASSWORD) return false;
  return token === process.env.ADMIN_PASSWORD;
}
