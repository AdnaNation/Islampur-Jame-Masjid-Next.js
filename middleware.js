import { NextResponse } from "next/server";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Meta's servers call the webhook; it is protected by its own signature check.
  if (pathname.startsWith("/api/whatsapp/webhook")) return NextResponse.next();

  if (!SAFE_METHODS.has(request.method)) {
    const host =
      request.headers.get("x-forwarded-host") || request.headers.get("host");
    const origin = request.headers.get("origin");
    const fetchSite = request.headers.get("sec-fetch-site");

    let allowed = true;
    if (origin) {
      try {
        allowed = new URL(origin).host === host;
      } catch {
        allowed = false;
      }
    } else if (fetchSite && !["same-origin", "none"].includes(fetchSite)) {
      allowed = false;
    }

    if (!allowed) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ["/api/:path*"] };
