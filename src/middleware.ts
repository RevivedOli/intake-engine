import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_PATHS = ["/login", "/auth", "/dashboard", "/api/auth"];
const DEFAULT_ADMIN_HOSTS = "localhost";

function getAdminAllowedHosts(): string[] {
  const raw = process.env.ADMIN_ALLOWED_HOSTS ?? DEFAULT_ADMIN_HOSTS;
  return raw.split(",").map((h) => h.trim().toLowerCase()).filter(Boolean);
}

function isAdminPath(pathname: string): boolean {
  return (
    ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
  );
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hostHeader =
    request.headers.get("host") ??
    request.headers.get("x-forwarded-host") ??
    "";
  const host = hostHeader.includes(":")
    ? hostHeader.split(":")[0].toLowerCase()
    : hostHeader.toLowerCase();

  if (isAdminPath(pathname)) {
    const allowed = getAdminAllowedHosts();
    if (!allowed.includes(host)) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  const ts = new Date().toISOString();
  console.log(
    `[Request] ${request.method} ${pathname} host=${hostHeader} at ${ts}`
  );
  return NextResponse.next();
}
