"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type Row = { id: number; name: string; createdAt?: string | null };

function fmtDate(v: any) {
  if (!v) return "";
  try {
    return new Date(v).toLocaleDateString("es-AR");
  } catch {
    return String(v);
  }
}

export default function PosicionesPage() {
  const [pos, setPos] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  const inputRef = useRef<HTMLInputElement | null>(null);

  const total = useMemo(() => rows.length, [rows]);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/posiciones/list", { credentials: "include" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP_${res.status}`);
      setRows(Array.isArray(data.rows) ? data.rows : []);
    } catch (e: any) {
      setErr(e?.message || "ERROR_INTERNO");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  async function crear() {
    const raw = String(pos || "").trim().toUpperCase();
    if (!raw) return;

    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/posiciones/create", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posicion: raw }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP_${res.status}`);

      setPos("");
      await load();
      setTimeout(() => inputRef.current?.focus(), 0);
    } catch (e: any) {
      setErr(e?.message || "ERROR_INTERNO");
    } finally {
      setLoading(false);
    }
  }

  async function eliminar(id: number) {
    if (!confirm("¿Eliminar posición?")) return;

    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/posiciones/delete", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP_${res.status}`);

      await load();
    } catch (e: any) {
      setErr(e?.message || "ERROR_INTERNO");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: 54, fontWeight: 800, margin: 0 }}>Posiciones</h1>
          <div style={{ marginTop: 6, opacity: 0.85 }}>
            Alta y mantenimiento de posiciones. Total: <b>{total}</b>
          </div>
        </div>

        <Link
          href="/despacho"
          style={{
            height: 44,
            display: "inline-flex",
            alignItems: "center",
            padding: "0 18px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.25)",
            background: "rgba(0,0,0,0.35)",
            color: "white",
            fontWeight: 900,
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          Volver a Despacho
        </Link>
      </div>

      <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center" }}>
        <input
          ref={inputRef}
          value={pos}
          onChange={(e) => setPos(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && crear()}
          placeholder="Posición (ej. A1-01)"
          style={{
            flex: 1,
            height: 44,
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.20)",
            background: "rgba(0,0,0,0.35)",
            color: "white",
            padding: "0 14px",
            fontSize: 18,
            outline: "none",
          }}
        />

        <button
          onClick={crear}
          disabled={loading || !pos.trim()}
          style={{
            height: 44,
            padding: "0 18px",
            borderRadius: 14,
            background: "#f38b00",
            color: "black",
            fontWeight: 900,
            border: "none",
            cursor: "pointer",
            minWidth: 120,
            opacity: loading || !pos.trim() ? 0.6 : 1,
          }}
        >
          Crear
        </button>
      </div>

      {err ? (
        <div style={{ marginTop: 10, color: "#ff5a5a", fontWeight: 800 }}>
          {err}
        </div>
      ) : null}

      <div
        style={{
          marginTop: 14,
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(0,0,0,0.18)",
          overflowX: "auto",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.10)" }}>
              <th style={{ textAlign: "left", padding: 12, fontWeight: 900 }}>ID</th>
              <th style={{ textAlign: "left", padding: 12, fontWeight: 900 }}>Posición</th>
              <th style={{ textAlign: "left", padding: 12, fontWeight: 900 }}>Alta</th>
              <th style={{ textAlign: "right", padding: 12, fontWeight: 900 }}>Acción</th>
            </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td style={{ padding: 12, opacity: 0.8 }} colSpan={4}>Cargando...</td>
            </tr>
          ) : rows.length ? (
            rows.map((r) => (
              <tr key={r.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <td style={{ padding: 12 }}>{r.id}</td>
                <td style={{ padding: 12, fontWeight: 900 }}>{r.name}</td>
                <td style={{ padding: 12 }}>{fmtDate(r.createdAt)}</td>
                <td style={{ padding: 12, textAlign: "right" }}>
                  <button
                    onClick={() => eliminar(r.id)}
                    disabled={loading}
                    style={{
                      height: 34,
                      padding: "0 12px",
                      borderRadius: 12,
                      background: "rgba(255,80,80,0.15)",
                      color: "#ff6a6a",
                      fontWeight: 900,
                      border: "1px solid rgba(255,80,80,0.25)",
                      cursor: "pointer",
                      opacity: loading ? 0.6 : 1,
                    }}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td style={{ padding: 12, opacity: 0.8 }} colSpan={4}>Sin registros.</td>
            </tr>
          )}
        </tbody>
        </table>
      </div>

      <div style={{ marginTop: 8, opacity: 0.65, fontSize: 13 }}>
        Responsive: la tabla scrollea horizontal en móviles.
      </div>
    </div>
  );
}
