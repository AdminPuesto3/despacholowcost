import { NextResponse } from "next/server";

function clearAll(req: Request) {
  const res = NextResponse.redirect(new URL("/login", req.url));

  // borrar cookies (session + token + role)
  res.cookies.set("session", "", { path: "/", maxAge: 0 });
  res.cookies.set("token", "", { path: "/", maxAge: 0 });
  res.cookies.set("role", "", { path: "/", maxAge: 0 });

  return res;
}

// Para que el link <a href="/api/logout"> funcione (GET)
export async function GET(req: Request) {
  return clearAll(req);
}

// Para fetch() si lo usás con POST
export async function POST(req: Request) {
  return clearAll(req);
}
