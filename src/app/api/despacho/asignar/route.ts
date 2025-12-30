import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

function normPos(s: string) {
  const raw = String(s || "").trim().toUpperCase();
  if (!raw) return "";
  return raw.split("/")[0].trim();
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token || !verifyToken(token)) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const items = Array.isArray(body?.items) ? body.items : [];

    if (!items.length) {
      return NextResponse.json({ ok: false, error: "FALTAN_DATOS" }, { status: 400 });
    }

    const errors: any[] = [];
    let updated = 0;

    for (const it of items) {
      const nota = String(it?.nota || "").trim();
      const posIn = String(it?.pos || "").trim();
      const pos = normPos(posIn);

      if (!nota || !pos) {
        errors.push({ nota, pos: posIn, error: "FALTAN_DATOS" });
        continue;
      }

      const pend = await prisma.pendiente.findFirst({
        where: { notasRaw: nota },
        orderBy: { id: "desc" },
        select: { id: true, positionId: true },
      });

      if (!pend) {
        errors.push({ nota, pos, error: "NOTA_NO_ENCONTRADA" });
        continue;
      }

      if (pend.positionId) {
        errors.push({ nota, pos, error: "YA_TIENE_POSICION" });
        continue;
      }

      // ⚠️ NO CREAR: buscar posición existente por Position.posicion
      const posRow = await prisma.position.findFirst({
        where: { posicion: pos },
        select: { id: true },
      });

      if (!posRow) {
        errors.push({ nota, pos, error: "POSICION_NO_EXISTE" });
        continue;
      }

      await prisma.pendiente.update({
        where: { id: pend.id },
        data: { positionId: posRow.id },
      });

      updated++;
    }

    return NextResponse.json({ ok: true, updated, errors });
  } catch (err) {
    console.error("[DESPACHO ASIGNAR]", err);
    return NextResponse.json({ ok: false, error: "ERROR" }, { status: 500 });
  }
}
