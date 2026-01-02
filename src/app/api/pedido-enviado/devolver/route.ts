import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const id = Number(body?.id);
    if (!id) return NextResponse.json({ ok: false, error: "ID_INVALIDO" }, { status: 400 });

    const pedido = await prisma.pedidoEnviado.findUnique({ where: { id } });
    if (!pedido) return NextResponse.json({ ok: false, error: "NO_EXISTE" }, { status: 404 });

    // 1) devolver a DESPACHO: despachadoAt -> null
    if (pedido.notasHash) {
      await prisma.pendiente.updateMany({
        where: { notasHash: pedido.notasHash },
        data: { despachadoAt: null },
      });
    } else if (pedido.nota) {
      // fallback cuando notasHash viene null:
      await prisma.pendiente.updateMany({
        where: { notasRaw: { contains: pedido.nota } },
        data: { despachadoAt: null },
      });
    }

    // 2) borrar el registro en enviados
    await prisma.pedidoEnviado.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
