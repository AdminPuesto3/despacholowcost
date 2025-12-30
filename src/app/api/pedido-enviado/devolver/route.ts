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
    const id = Number(body?.id);
    if (!id) return NextResponse.json({ ok: false, error: "ID_INVALIDO" }, { status: 400 });

    // TODO: Ajustar "pedidoEnviado" al nombre real del modelo en Prisma
    // y el campo nota/posicion según tu schema real.
    const pe = await (prisma as any).pedidoEnviado.findUnique({ where: { id } });
    if (!pe) return NextResponse.json({ ok: false, error: "NO_EXISTE" }, { status: 404 });

    // Al devolver: lo volvemos a DESPACHO => en Pendiente debe volver a tener positionId
    // Si vos al enviar lo "des-ubicás", entonces acá reubicamos usando pe.positionId/posicion.
    // Si vos al enviar dejás pendiente intacto y solo copiás a enviados, entonces acá solo borrás el enviado.
    // Ajustá según tu flujo real:

    // EJEMPLO 1: si al enviar borraste/quitaste positionId en Pendiente, reponelo:
    // await prisma.pendiente.update({ where: { notasRaw: pe.nota }, data: { positionId: pe.positionId ?? null } });

    // EJEMPLO 2 (simple y común): si "enviado" es solo histórico y Pendiente ya no está en despacho:
    // lo devolvemos recreando un Pendiente o revirtiendo flags.
    // ----
    // Por ahora: lo mínimo seguro es borrar el registro enviado (y que reaparezca en despacho si tu sistema lo maneja).
    await (prisma as any).pedidoEnviado.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PEDIDO ENVIADO DEVOLVER]", err);
    return NextResponse.json({ ok: false, error: "ERROR_INTERNO" }, { status: 500 });
  }
}
