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
    const take = Math.min(Number(searchParams.get("take") || 200), 500);
    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const q = String(searchParams.get("q") || "").trim();

    const where: any = {};

    if (q) {
      if (/^\d+$/.test(q)) where.nota = q;
      else where.cliente = { contains: q };
    }

    const [count, rows] = await Promise.all([
      prisma.pedidoEnviado.count({ where }),
      prisma.pedidoEnviado.findMany({
        where,
        orderBy: { id: "desc" },
        skip: (page - 1) * take,
        take,
        select: {
          id: true,
          nota: true,
          posicion: true,
          bultos: true,
          cliente: true,
          operador: true,
          enviadoAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      count,
      pages: Math.max(1, Math.ceil(count / take)),
      page,
      take,
      rows,
    });
  } catch (err) {
    console.error("[PEDIDO_ENVIADO LIST]", err);
    return NextResponse.json({ ok: false, error: "ERROR_INTERNO" }, { status: 500 });
  }
}
