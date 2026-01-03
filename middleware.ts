import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/api/login",
  "/api/logout",
  "/_next",
  "/favicon.ico",
  "/logo.png",
];

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p))) return true;
  // permitir assets comunes
  if (pathname.startsWith("/_next/")) return true;
  return false;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  const session = req.cookies.get("session")?.value;

  if (session !== "ok") {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
