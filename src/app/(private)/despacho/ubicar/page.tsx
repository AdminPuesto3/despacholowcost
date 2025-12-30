"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";

type PendienteRow = {
  id: number;
  notasRaw: string;
  bultos: number;
  operador?: string | null;
  cliente?: string | null;
  finalizadoAt?: string | Date | null;
  positionId: number | null;
};

type CartItem = {
  nota: string;
  pos: string;
  cliente: string;
  bultos: number;
  finalizadoAt: string | Date | null;
};

function normNota(s: string) {
  return String(s || "").trim();
}

// Si viene "2B-Q / ANDREANI" => "2B-Q"
function normPos(s: string) {
  const raw = String(s || "").trim().toUpperCase();
  if (!raw) return "";
  const first = raw.split("/")[0].trim();
  return first;
}

function fmtDate(v: any) {
  if (!v) return "";
  try {
    return new Date(v).toLocaleString("es-AR");
  } catch {
    return String(v);
  }
}

export default function UbicarPedidoPage() {
  const [nota, setNota] = useState("");
  const [pos, setPos] = useState("");

  const [info, setInfo] = useState<PendienteRow | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [loadingNota, setLoadingNota] = useState(false);
  const [loadingAsignar, setLoadingAsignar] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const notaRef = useRef<HTMLInputElement | null>(null);
  const posRef = useRef<HTMLInputElement | null>(null);

  const titulo = useMemo(() => "Ubicar pedido", []);

  async function buscarNota(n: string) {
    const clean = normNota(n);
    if (!clean) return;

    setLoadingNota(true);
    setErr(null);
    setInfo(null);

    try {
      const res = await fetch(`/api/pendiente/by-nota?nota=${encodeURIComponent(clean)}`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP_${res.status}`);

      const row: PendienteRow = data.row;

      if (row.positionId) {
        throw new Error("Esa NOTA ya tiene posición (ya está en DESPACHO).");
      }

      setInfo(row);

      // pasar foco a POS
      setTimeout(() => posRef.current?.focus(), 0);
    } catch (e: any) {
      setErr(String(e?.message || e));
      setInfo(null);
      setTimeout(() => notaRef.current?.focus(), 0);
    } finally {
      setLoadingNota(false);
    }
  }

  function agregarAlCarrito() {
    setErr(null);

    const n = normNota(nota);
    const p = normPos(pos);

    if (!n) return setErr("Falta NOTA.");
    if (!info) return setErr("Primero escaneá/buscá la NOTA.");
    if (!p) return setErr("Falta POSICIÓN.");

    if (cart.some((x) => x.nota === n)) {
      setErr("Esa NOTA ya está en la lista.");
      setPos("");
      setTimeout(() => posRef.current?.focus(), 0);
      return;
    }

    setCart((prev) => [
      ...prev,
      {
        nota: n,
        pos: p,
        cliente: String(info.cliente || ""),
        bultos: Number(info.bultos || 0),
        finalizadoAt: info.finalizadoAt || null,
      },
    ]);

    // limpiar y siguiente
    setNota("");
    setPos("");
    setInfo(null);
    setTimeout(() => notaRef.current?.focus(), 0);
  }

  function quitarDeLista(n: string) {
    setCart((prev) => prev.filter((x) => x.nota !== n));
  }

  async function asignarTodo() {
    if (!cart.length) return;

    setLoadingAsignar(true);
    setErr(null);

    try {
      const res = await fetch("/api/despacho/asignar", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((x) => ({ nota: x.nota, pos: x.pos })),
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP_${res.status}`);

      const errors = Array.isArray(data.errors) ? data.errors : [];
      if (errors.length) {
        setErr(`Hubo errores: ${JSON.stringify(errors).slice(0, 260)}...`);
      } else {
        setCart([]);
      }
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setLoadingAsignar(false);
      setTimeout(() => notaRef.current?.focus(), 0);
    }
  }

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 44, fontWeight: 800, margin: 0 }}>{titulo}</h1>
          <div style={{ opacity: 0.75, marginTop: 6 }}>
            Escaneá NOTA, y después POSICIÓN. Se agrega a “Listo a ubicar”.
          </div>
        </div>

        <Link
          href="/despacho"
          style={{
            height: 44,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 14px",
            borderRadius: 12,
            background: "transparent",
            color: "#fff",
            fontWeight: 800,
            textDecoration: "none",
            border: "1px solid rgba(255,255,255,.18)",
            whiteSpace: "nowrap",
          }}
        >
          Volver a Despacho
        </Link>
      </div>

      <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 800, marginBottom: 8, opacity: 0.9 }}>1) NOTA (scan o escribir)</div>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              ref={notaRef}
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Ej: 61071"
              style={{
                flex: 1,
                height: 48,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,.12)",
                background: "rgba(0,0,0,.35)",
                color: "#fff",
                padding: "0 14px",
                fontSize: 16,
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") buscarNota(nota);
              }}
            />
            <button
              onClick={() => buscarNota(nota)}
              disabled={loadingNota || !nota.trim()}
              style={{
                height: 48,
                padding: "0 18px",
                borderRadius: 12,
                background: "#ff7a00",
                color: "#000",
                fontWeight: 900,
                border: "1px solid rgba(255,255,255,.15)",
                cursor: loadingNota ? "not-allowed" : "pointer",
                opacity: loadingNota || !nota.trim() ? 0.6 : 1,
                minWidth: 110,
              }}
            >
              {loadingNota ? "Buscando..." : "Buscar"}
            </button>
          </div>

          {info ? (
            <div
              style={{
                marginTop: 10,
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,.12)",
                background: "rgba(0,0,0,.25)",
              }}
            >
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Datos</div>
              <div style={{ opacity: 0.9 }}>
                <b>Cliente:</b> {info.cliente || ""}
              </div>
              <div style={{ opacity: 0.9 }}>
                <b>Bultos:</b> {info.bultos}
              </div>
              <div style={{ opacity: 0.9 }}>
                <b>Finalizado:</b> {fmtDate(info.finalizadoAt)}
              </div>
            </div>
          ) : null}
        </div>

        <div>
          <div style={{ fontWeight: 800, marginBottom: 8, opacity: 0.9 }}>2) POSICIÓN (QR trae el texto)</div>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              ref={posRef}
              value={pos}
              onChange={(e) => setPos(e.target.value)}
              placeholder="Ej: 2B-Q / ANDREANI"
              disabled={!info}
              style={{
                flex: 1,
                height: 48,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,.12)",
                background: "rgba(0,0,0,.35)",
                color: "#fff",
                padding: "0 14px",
                fontSize: 16,
                opacity: info ? 1 : 0.55,
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") agregarAlCarrito();
              }}
            />
            <button
              onClick={agregarAlCarrito}
              disabled={!info || !pos.trim()}
              style={{
                height: 48,
                padding: "0 18px",
                borderRadius: 12,
                background: "#ff7a00",
                color: "#000",
                fontWeight: 900,
                border: "1px solid rgba(255,255,255,.15)",
                cursor: !info ? "not-allowed" : "pointer",
                opacity: !info || !pos.trim() ? 0.6 : 1,
                minWidth: 150,
              }}
            >
              Agregar a lista
            </button>
          </div>

          <div style={{ marginTop: 8, opacity: 0.75 }}>
            Tip: flujo rápido = NOTA (Enter) → POS (Enter).
          </div>
        </div>
      </div>

      {err ? (
        <div style={{ marginTop: 12, color: "#ff4d4d", fontWeight: 900 }}>ERROR: {err}</div>
      ) : null}

      <div style={{ marginTop: 18, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 900 }}>Listo a ubicar: {cart.length}</div>
        <button
          onClick={asignarTodo}
          disabled={!cart.length || loadingAsignar}
          style={{
            height: 44,
            padding: "0 16px",
            borderRadius: 12,
            background: "#ff7a00",
            color: "#000",
            fontWeight: 900,
            border: "1px solid rgba(255,255,255,.15)",
            cursor: !cart.length ? "not-allowed" : "pointer",
            opacity: !cart.length || loadingAsignar ? 0.6 : 1,
          }}
        >
          {loadingAsignar ? "Asignando..." : "Asignar posiciones"}
        </button>
      </div>

      <div style={{ marginTop: 10, borderRadius: 14, border: "1px solid rgba(255,255,255,.12)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,.06)" }}>
              <th style={{ textAlign: "left", padding: 12 }}>Nota</th>
              <th style={{ textAlign: "left", padding: 12 }}>Posición</th>
              <th style={{ textAlign: "left", padding: 12 }}>Cliente</th>
              <th style={{ textAlign: "right", padding: 12 }}>Bultos</th>
              <th style={{ textAlign: "right", padding: 12 }}>Quitar</th>
            </tr>
          </thead>
          <tbody>
            {!cart.length ? (
              <tr>
                <td colSpan={5} style={{ padding: 14, opacity: 0.7 }}>
                  Sin registros.
                </td>
              </tr>
            ) : (
              cart.map((x) => (
                <tr key={x.nota} style={{ borderTop: "1px solid rgba(255,255,255,.08)" }}>
                  <td style={{ padding: 12, fontWeight: 900 }}>{x.nota}</td>
                  <td style={{ padding: 12, fontWeight: 900 }}>{x.pos}</td>
                  <td style={{ padding: 12 }}>{x.cliente}</td>
                  <td style={{ padding: 12, textAlign: "right", fontWeight: 900 }}>{x.bultos}</td>
                  <td style={{ padding: 12, textAlign: "right" }}>
                    <button
                      onClick={() => quitarDeLista(x.nota)}
                      style={{
                        height: 34,
                        padding: "0 12px",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,.18)",
                        background: "rgba(0,0,0,.3)",
                        color: "#fff",
                        fontWeight: 900,
                        cursor: "pointer",
                      }}
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
