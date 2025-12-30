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
      return NextResponse.json({ ok: false, error: "FALTAN_DATOS" }, { status: 400 });
    }

    const row = await prisma.pendiente.findFirst({
      where: {
        notasRaw: nota,
        positionId: { not: null },
        despachadoAt: null,
      },
      orderBy: { id: "desc" },
      select: {
        id: true,
        notasRaw: true,
        bultos: true,
        cliente: true,
        finalizadoAt: true,
        position: true,
      },
    });

    if (!row) {
      return NextResponse.json({ ok: false, error: "NO_ENCONTRADO" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      pendiente: {
        id: row.id,
        nota: row.notasRaw,
        bultos: row.bultos,
        cliente: row.cliente,
        finalizadoAt: row.finalizadoAt,
        posicion: (row as any)?.position?.posicion ?? "",
      },
    });
  } catch (err) {
    console.error("[SACAR LOOKUP]", err);
    return NextResponse.json({ ok: false, error: "ERROR_INTERNO" }, { status: 500 });
  }
}
