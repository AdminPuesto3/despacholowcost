import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Dejar pasar TODO lo de API. La auth la hacen los handlers.
  if (pathname.startsWith("/api")) return NextResponse.next();

  // Archivos estáticos
  if (pathname.includes(".")) return NextResponse.next();

  // Next internals
  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") return NextResponse.next();

  // Login siempre permitido
  if (pathname === "/login") return NextResponse.next();

  // Protegemos el resto por cookie token
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
