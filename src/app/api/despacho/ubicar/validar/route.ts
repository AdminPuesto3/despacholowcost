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

    if (!nota) {
      return NextResponse.json({ ok: false, error: "FALTA_NOTA" }, { status: 400 });
    }

    const pend = await prisma.pendiente.findFirst({
      where: { notasRaw: nota },
      orderBy: { id: "desc" },
      select: {
        id: true,
        notasRaw: true,
        bultos: true,
        cliente: true,
        finalizadoAt: true,
        positionId: true,
      },
    });

    if (!pend) {
      return NextResponse.json({ ok: false, error: "NOTA_NO_EXISTE" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      row: {
        id: pend.id,
        nota: pend.notasRaw,
        bultos: pend.bultos,
        cliente: pend.cliente,
        finalizadoAt: pend.finalizadoAt,
        yaUbicado: pend.positionId != null,
      },
    });
  } catch (err) {
    console.error("[DESPACHO UBICAR VALIDAR]", err);
    return NextResponse.json({ ok: false, error: "ERROR_INTERNO" }, { status: 500 });
  }
}
