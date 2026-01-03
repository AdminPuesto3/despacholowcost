import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const raw = String(body?.posicion ?? body?.pos ?? body?.name ?? "")
      .trim()
      .toUpperCase();

    if (!raw) return NextResponse.json({ ok: false, error: "POSICION_VACIA" }, { status: 400 });

    const row = await prisma.position.create({
      data: { posicion: raw },
      select: { id: true, posicion: true, createdAt: true },
    });

    return NextResponse.json({ ok: true, row });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
