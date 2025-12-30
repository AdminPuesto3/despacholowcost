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

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const a = await requireAuth();
  if ("error" in a) return a.error;

  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const body = await req.json().catch(() => null);

  const data: { active?: boolean; posicion?: string } = {};
  if (body?.active !== undefined) data.active = Boolean(body.active);
  if (body?.posicion !== undefined) data.posicion = String(body.posicion).trim();

  try {
    const updated = await prisma.position.update({ where: { id }, data });
    return NextResponse.json({ ok: true, item: updated });
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 400 });
  }
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const a = await requireAuth();
  if ("error" in a) return a.error;

  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  try {
    await prisma.position.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No se pudo eliminar" }, { status: 400 });
  }
}
