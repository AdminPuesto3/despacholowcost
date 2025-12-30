import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function GET(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(/(?:^|;\s*)token=([^;]+)/);
  const token = match?.[1];

  if (!token) {
    return NextResponse.json({ error: "Token faltante" }, { status: 401 });
  }

  try {
    const user = verifyToken(decodeURIComponent(token));
    return NextResponse.json({ ok: true, user });
  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
}
