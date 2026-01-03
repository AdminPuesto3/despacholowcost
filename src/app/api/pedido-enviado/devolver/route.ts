import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const id = Number(body?.id);
    if (!id) return NextResponse.json({ ok: false, error: "ID_INVALIDO" }, { status: 400 });

    const pedido = await prisma.pedidoEnviado.findUnique({ where: { id } });
    if (!pedido) return NextResponse.json({ ok: false, error: "NO_EXISTE" }, { status: 404 });

    // devolver a DESPACHO:
    // - despachadoAt null
    // - positionId null (para que vuelva a "sin ubicar", si aplica)
    // - finalizadoAt null (por si tu lista filtra por finalizado)
    if (pedido.notasHash) {
      await prisma.pendiente.updateMany({
        where: { notasHash: pedido.notasHash },
        data: {
          despachadoAt: null,
          positionId: null,
          finalizadoAt: null,
        },
      });
    }

    // borrar el registro de enviados (así no queda duplicado)
    await prisma.pedidoEnviado.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
