"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type MeResponse =
  | { ok: true; user: { username: string; role: string } }
  | { error: string };

export default function TopBar() {
  const [userLabel, setUserLabel] = useState<string>("");

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/auth/me", { cache: "no-store" });
      const data = (await r.json().catch(() => ({}))) as MeResponse;
      if ("ok" in data && data.ok) {
        setUserLabel(data.user.role || data.user.username);
      }
    })();
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <header className="h-14 bg-black border-b border-zinc-800 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <Image src="/logo.png" alt="LOWCOST" width={140} height={40} priority />
        <span className="text-sm text-zinc-400 hidden sm:inline">WMS Despacho</span>
      </div>

      <div className="flex items-center gap-3">
        {userLabel && <span className="text-sm text-white">{userLabel}</span>}
        <button
          onClick={logout}
          className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-black text-sm font-semibold"
        >
          Salir
        </button>
      </div>
    </header>
  );
}
