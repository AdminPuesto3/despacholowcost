import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

function pickPosString(position: any): string {
  if (!position || typeof position !== "object") return "";
  // Position real: { id, posicion, active, createdAt, updatedAt }
  if (typeof position.posicion === "string") return position.posicion.trim();
  return "";
}

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token || !verifyToken(token)) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const take = Math.min(Number(searchParams.get("take") || 200), 500);
    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const q = String(searchParams.get("q") || "").trim();

    // SOLO ubicados + NO despachados
    const where: any = {
      positionId: { not: null },
      despachadoAt: null,
    };

    if (q) {
      if (/^\d+$/.test(q)) {
        where.notasRaw = q;
      } else {
        where.cliente = { contains: q };
      }
    }

    const [count, rows] = await Promise.all([
      prisma.pendiente.count({ where }),
      prisma.pendiente.findMany({
        where,
        orderBy: { id: "desc" },
        skip: (page - 1) * take,
        take,
        select: {
          id: true,
          notasRaw: true,
          bultos: true,
          cliente: true,
          finalizadoAt: true,
          position: true,
        },
      }),
    ]);

    const data = rows.map((r: any) => ({
      id: r.id,
      nota: String(r.notasRaw || "").trim(),
      posicion: pickPosString(r.position),
      bultos: r.bultos ?? 0,
      cliente: r.cliente ?? "",
      finalizadoAt: r.finalizadoAt ?? null,
    }));

    return NextResponse.json({
      ok: true,
      count,
      pages: Math.max(1, Math.ceil(count / take)),
      page,
      take,
      rows: data,
    });
  } catch (err) {
    console.error("[DESPACHO LIST]", err);
    return NextResponse.json({ ok: false, error: "ERROR_INTERNO" }, { status: 500 });
  }
}
