import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "CREDENCIALES_INCOMPLETAS" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.active === false) {
      return NextResponse.json({ ok: false, error: "INVALID_LOGIN" }, { status: 401 });
    }

    // password en DB es hash (len ~60)
    const okPass = await bcrypt.compare(password, user.password);
    if (!okPass) {
      return NextResponse.json({ ok: false, error: "INVALID_LOGIN" }, { status: 401 });
    }

    // IMPORTANTE: el resto del sistema está esperando "token"
    // Seteamos AMBAS cookies para compatibilidad: token + session
    const res = NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, role: user.role },
    });

    const cookieBase = {
      path: "/",
      httpOnly: true,
      sameSite: "lax" as const,
      secure: true,
      maxAge: 60 * 60 * 24 * 30, // 30 días
    };

    res.cookies.set("session", "ok", cookieBase);
    res.cookies.set("token", `u:${user.id}`, cookieBase);
    res.cookies.set("role", String(user.role || ""), cookieBase);

    return res;
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
