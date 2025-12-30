import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

type Item = {
  nota: string;
  posicion: string;
  bultos: number;
  cliente: string;
};

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const items: Item[] = Array.isArray(body?.items) ? body.items : [];
    if (!items.length) return NextResponse.json({ ok: false, error: "FALTAN_ITEMS" }, { status: 400 });

    // (si tu verifyToken devuelve user, acá lo podemos sacar; por ahora guardamos operador vacío)
    const operador = "admin";

    const result = await prisma.$transaction(async (tx) => {
      let created = 0;
      let cleared = 0;
      const errors: any[] = [];

      for (const it of items) {
        const nota = String(it?.nota || "").trim();
        if (!nota) {
          errors.push({ nota, error: "FALTA_NOTA" });
          continue;
        }

        // buscamos el pendiente ubicado (para agarrar notasHash y posición real)
        const pend = await tx.pendiente.findFirst({
          where: { notasRaw: nota, positionId: { not: null } },
          orderBy: { id: "desc" },
          select: {
            id: true,
            notasRaw: true,
            notasHash: true,
            bultos: true,
            cliente: true,
            position: { select: { posicion: true } },
          },
        });

        if (!pend) {
          errors.push({ nota, error: "NO_ENCONTRADO_EN_DESPACHO" });
          continue;
        }

        const posReal = pend.position?.posicion || String(it?.posicion || "").trim();

        // crear en historial
        await tx.pedidoEnviado.create({
          data: {
            nota: pend.notasRaw,
            notasHash: pend.notasHash || null,
            cliente: pend.cliente || "",
            bultos: Number(pend.bultos || 0),
            posicion: posReal,
            operador,
          },
        });

        created++;

        // sacar de DESPACHO => dejar sin positionId
        const upd = await tx.pendiente.updateMany({
          where: { notasRaw: pend.notasRaw, positionId: { not: null } },
          data: { positionId: null },
        });

        cleared += upd.count;
      }

      return { created, cleared, errors };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    // si intenta duplicar notasHash único, lo reportamos prolijo
    const msg = String(err?.message || err);
    console.error("[DESPACHO SACAR ENVIAR]", err);
    if (msg.includes("Unique constraint") || msg.includes("unique")) {
      return NextResponse.json({ ok: false, error: "DUPLICADO" }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: "ERROR_INTERNO" }, { status: 500 });
  }
}
