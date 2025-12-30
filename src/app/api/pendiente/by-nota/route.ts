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
      where: { notasRaw: nota },
      orderBy: { id: "desc" },
      select: {
        id: true,
        notasRaw: true,
        bultos: true,
        operador: true,
        cliente: true,
        finalizadoAt: true,
        positionId: true,
      },
    });

    if (!row) return NextResponse.json({ ok: false, error: "NOTA_NO_ENCONTRADA" }, { status: 404 });

    return NextResponse.json({ ok: true, row });
  } catch (err) {
    console.error("[BY NOTA]", err);
    return NextResponse.json({ ok: false, error: "ERROR" }, { status: 500 });
  }
}
