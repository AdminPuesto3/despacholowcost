import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

function num(v: string | null, d: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function parseNotas(q: string) {
  // acepta "60113" o "60795/60796/60797" o con espacios/comas
  return q
    .split(/[\/,\s]+/g)
    .map(s => s.trim())
    .filter(Boolean)
    .filter(s => /^\d+$/.test(s));
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const takeRaw = num(url.searchParams.get("take"), 200);
    const take = Math.max(1, Math.min(200, takeRaw));
    const page = Math.max(1, num(url.searchParams.get("page"), 1));
    const q = (url.searchParams.get("q") || "").trim();

    const offset = (page - 1) * take;

    // Si q tiene letras -> buscar por cliente (case-insensitive con LOWER)
    const hasLetters = /[a-zA-ZáéíóúñÁÉÍÓÚÑ]/.test(q);
    const notas = !hasLetters ? parseNotas(q) : [];

    // Sin filtro
    if (!q) {
      const countRow = await prisma.pendiente.count();
      const rows = await prisma.pendiente.findMany({
        orderBy: { id: "desc" },
        take,
        skip: offset,
        select: { id: true, notasRaw: true, bultos: true, operador: true, cliente: true, finalizadoAt: true },
      });
      const pages = Math.max(1, Math.ceil(countRow / take));
      return NextResponse.json({ ok: true, take, page, count: countRow, pages, rows });
    }

    // Buscar por NOTA(s)
    if (!hasLetters && notas.length) {
      const where = { notasRaw: { in: notas } };
      const countRow = await prisma.pendiente.count({ where });
      const rows = await prisma.pendiente.findMany({
        where,
        orderBy: { id: "desc" },
        take,
        skip: offset,
        select: { id: true, notasRaw: true, bultos: true, operador: true, cliente: true, finalizadoAt: true },
      });
      const pages = Math.max(1, Math.ceil(countRow / take));
      return NextResponse.json({ ok: true, take, page, count: countRow, pages, rows });
    }

    // Buscar por CLIENTE (case-insensitive en SQLite con SQL)
    const qLower = q.toLowerCase();

    const countSql = Prisma.sql`
      SELECT COUNT(*) as c
      FROM Pendiente
      WHERE LOWER(cliente) LIKE ${"%" + qLower + "%"}
    `;
    const countRes = await prisma.$queryRaw<{ c: number }[]>(countSql);
    const countRow = Number(countRes?.[0]?.c ?? 0);

    const rowsSql = Prisma.sql`
      SELECT id, notasRaw, bultos, operador, cliente, finalizadoAt
      FROM Pendiente
      WHERE LOWER(cliente) LIKE ${"%" + qLower + "%"}
      ORDER BY id DESC
      LIMIT ${take} OFFSET ${offset}
    `;
    const rows = await prisma.$queryRaw<any[]>(rowsSql);

    const pages = Math.max(1, Math.ceil(countRow / take));
    return NextResponse.json({ ok: true, take, page, count: countRow, pages, rows });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
