import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromCookies } from "@/lib/token";
import { verifyToken } from "@/lib/auth";

async function requireAuth() {
  const token = await getTokenFromCookies();
  if (!token) return { error: NextResponse.json({ error: "Token faltante" }, { status: 401 }) };
  try {
    verifyToken(token);
    return { ok: true as const };
  } catch {
    return { error: NextResponse.json({ error: "Token inválido" }, { status: 401 }) };
  }
}

export async function GET() {
  const a = await requireAuth();
  if ("error" in a) return a.error;

  const items = await prisma.position.findMany({ orderBy: { id: "desc" } });
  return NextResponse.json({ ok: true, items });
}

export async function POST(req: Request) {
  const a = await requireAuth();
  if ("error" in a) return a.error;

  const body = await req.json().catch(() => null);
  const posicion = String(body?.posicion || "").trim();

  if (!posicion) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  try {
    const created = await prisma.position.create({ data: { posicion } });
    return NextResponse.json({ ok: true, item: created });
  } catch {
    return NextResponse.json({ error: "No se pudo crear (¿duplicada?)" }, { status: 400 });
  }
}
