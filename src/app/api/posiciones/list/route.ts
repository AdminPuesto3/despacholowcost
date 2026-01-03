import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rows = await prisma.position.findMany({
      where: { active: true },
      orderBy: { id: "desc" },
      select: { id: true, posicion: true, createdAt: true },
    });

    return NextResponse.json({ ok: true, rows });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
