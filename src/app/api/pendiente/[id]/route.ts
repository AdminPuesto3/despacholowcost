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

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const a = await requireAuth();
  if ("error" in a) return a.error;

  const { id } = await ctx.params;
  const num = Number(id);
  if (!Number.isFinite(num)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  await prisma.pendiente.delete({ where: { id: num } });
  return NextResponse.json({ ok: true });
}
