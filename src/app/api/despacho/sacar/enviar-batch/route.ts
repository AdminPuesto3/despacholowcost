import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token || !verifyToken(token)) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const ids = Array.isArray(body?.ids) ? body.ids : [];

    if (!ids.length) {
      return NextResponse.json({ ok: false, error: "FALTAN_DATOS" }, { status: 400 });
    }

    const now = new Date();

    const res = await prisma.pendiente.updateMany({
      where: {
        id: { in: ids.map((x: any) => Number(x)).filter((n: any) => Number.isFinite(n)) },
        positionId: { not: null },
        despachadoAt: null,
      },
      data: { despachadoAt: now },
    });

    return NextResponse.json({ ok: true, updated: res.count, total: ids.length });
  } catch (err) {
    console.error("[SACAR ENVIAR BATCH]", err);
    return NextResponse.json({ ok: false, error: "ERROR_INTERNO" }, { status: 500 });
  }
}
