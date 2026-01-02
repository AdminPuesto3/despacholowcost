"use client";

import { useState } from "react";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP_${res.status}`);

      window.location.href = "/despacho";
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ui-shell" style={{ display: "grid", placeItems: "center", padding: 18 }}>
      <div style={{ width: "100%", maxWidth: 520 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
          <Image src="/logo.png" alt="LOWCOST" width={260} height={70} priority style={{ height: "auto", width: "auto" }} />
        </div>

        <div className="ui-card" style={{ padding: 18 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900 }}>Ingresar</h1>
          <p style={{ margin: "6px 0 14px", opacity: 0.75 }}>WMS Despacho</p>

          <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 800, opacity: 0.85 }}>Email</label>
              <input className="ui-input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 800, opacity: 0.85 }}>Contraseña</label>
              <input className="ui-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </div>

            {err && (
              <div style={{ marginTop: 4, padding: 10, borderRadius: 12, border: "1px solid rgba(255,0,0,.18)", background: "rgba(255,0,0,.08)", color: "#ffb3b3", fontWeight: 800 }}>
                {err}
              </div>
            )}

            <button className="ui-btn ui-btn-primary" disabled={loading || !email.trim() || !password.trim()}>
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
