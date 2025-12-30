import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const nota = String(searchParams.get("nota") || "").trim();
    if (!nota) return NextResponse.json({ ok: false, error: "FALTA_NOTA" }, { status: 400 });

    const row = await prisma.pendiente.findFirst({
      where: { notasRaw: nota, positionId: { not: null } },
      orderBy: { id: "desc" },
      select: {
        id: true,
        notasRaw: true,
        bultos: true,
        cliente: true,
        finalizadoAt: true,
        position: { select: { posicion: true } },
      },
    });

    if (!row) return NextResponse.json({ ok: false, error: "NO_ENCONTRADO" }, { status: 404 });

    return NextResponse.json({
      ok: true,
      row: {
        id: row.id,
        nota: row.notasRaw,
        posicion: row.position?.posicion || "",
        bultos: row.bultos || 0,
        cliente: row.cliente || "",
        finalizadoAt: row.finalizadoAt ? row.finalizadoAt.toISOString() : null,
      },
    });
  } catch (err) {
    console.error("[DESPACHO SACAR BUSCAR]", err);
    return NextResponse.json({ ok: false, error: "ERROR_INTERNO" }, { status: 500 });
  }
}
