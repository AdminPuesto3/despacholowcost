import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

function sha1(s: string) {
  return crypto.createHash("sha1").update(s).digest("hex");
}

function authOk(req: Request) {
  // 1) API KEY fija (para Apps Script / integración)
  const intakeKey = process.env.INTAKE_KEY || "";
  const headerKey = req.headers.get("x-intake-key") || "";
  if (intakeKey && headerKey && headerKey === intakeKey) return true;

  // 2) fallback: JWT normal (tu app)
  try {
    // verifyToken: ajustá si tu helper firma/lee distinto
    // (si verifyToken espera token string, lo sacamos de Authorization o cookie)
    const auth = req.headers.get("authorization") || "";
    const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : "";
    const cookie = req.headers.get("cookie") || "";
    const m = cookie.match(/(?:^|;\s*)token=([^;]+)/);
    const cookieToken = m ? decodeURIComponent(m[1]) : "";
    const token = bearer || cookieToken;

    if (!token) return false;
    verifyToken(token);
    return true;
  } catch {
    return false;
  }
}

function parseFinalizadoAt(v: any): Date {
  // Acepta Date o string ISO; si viene vacío -> ahora (para que Prisma no rompa tipos)
  if (!v) return new Date();
  if (v instanceof Date && !isNaN(v.getTime())) return v;
  const d = new Date(String(v));
  if (!isNaN(d.getTime())) return d;
  return new Date();
}

export async function POST(req: Request) {
  try {
    if (!authOk(req)) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const items = Array.isArray(body?.items) ? body.items : [];

    if (!items.length) {
      return NextResponse.json({ ok: true, inserted: 0, updated: 0, total: 0 });
    }

    let inserted = 0;
    let updated = 0;

    for (const it of items) {
      const notasRaw = String(it?.notasRaw ?? "").trim();
      if (!notasRaw) continue;

      const notasHash = sha1(notasRaw);
      const bultos = Number(it?.bultos ?? 0) || 0;
      const operador = String(it?.operador ?? "").trim();
      const cliente = String(it?.cliente ?? "").trim();
      const finalizadoAt = parseFinalizadoAt(it?.finalizadoAt);

      const existing = await prisma.pendiente.findUnique({ where: { notasHash } });

      if (!existing) {
        await prisma.pendiente.create({
          data: {
            notasRaw,
            notasHash,
            notas: [notasRaw],
            bultos,
            operador,
            cliente,
            finalizadoAt,
            positionId: null,
          },
        });
        inserted++;
      } else {
        await prisma.pendiente.update({
          where: { notasHash },
          data: {
            bultos,
            operador,
            cliente,
            finalizadoAt,
          },
        });
        updated++;
      }
    }

    return NextResponse.json({ ok: true, inserted, updated, total: inserted + updated });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
