import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function getBaseUrl(req: Request) {
  const h = req.headers;
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function GET(req: Request) {
  // borrar cookie/sesión
  cookies().set("session", "", { httpOnly: true, expires: new Date(0), path: "/" });

  const base = getBaseUrl(req);
  return NextResponse.redirect(`${base}/login`);
}

export async function POST(req: Request) {
  // por si lo llamás por fetch POST
  cookies().set("session", "", { httpOnly: true, expires: new Date(0), path: "/" });

  const base = getBaseUrl(req);
  return NextResponse.json({ ok: true, redirect: `${base}/login` });
}
