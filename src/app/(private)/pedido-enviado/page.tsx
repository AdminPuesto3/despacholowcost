"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Row = {
  id: number;
  nota: string;
  posicion: string;
  bultos: number;
  cliente: string;
  enviadoAt: string | null;
};

function fmt(v: any) {
  if (!v) return "";
  try {
    return new Date(v).toLocaleString("es-AR");
  } catch {
    return String(v);
  }
}

export default function PedidoEnviadoPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [rows, setRows] = useState<Row[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [count, setCount] = useState(0);

  const take = 200;

  const canPrev = useMemo(() => page > 1, [page]);
  const canNext = useMemo(() => page < pages, [page, pages]);

  async function fetchData(nextPage = 1, nextQ = "") {
    setLoading(true);
    setErr(null);
    try {
      const url = `/api/pedido-enviado/list?take=${take}&page=${nextPage}&q=${encodeURIComponent(nextQ.trim())}`;
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP_${res.status}`);

      setRows(Array.isArray(data.rows) ? data.rows : []);
      setPage(Number(data.page || 1));
      setPages(Number(data.pages || 1));
      setCount(Number(data.count || 0));
    } catch (e: any) {
      setErr(e?.message || "ERROR");
    } finally {
      setLoading(false);
    }
  }

  async function devolver(id: number, nota: string) {
    if (!confirm(`Devolver la nota ${nota} a DESPACHO?`)) return;

    setErr(null);
    try {
      const res = await fetch("/api/pedido-enviado/devolver", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP_${res.status}`);

      // refrescar
      await fetchData(page, q);
    } catch (e: any) {
      setErr(e?.message || "ERROR");
    }
  }

  useEffect(() => {
    fetchData(1, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 54, fontWeight: 900, margin: 0 }}>Pedido Enviado</h1>
          <div style={{ opacity: 0.75, marginTop: 6 }}>Historial de todo lo que se sacó de DESPACHO.</div>
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

      <div style={{ marginTop: 18, display: "flex", gap: 10, alignItems: "center" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por NOTA o CLIENTE (ej: 61071 o pebbles)"
          style={{
            flex: 1,
            height: 46,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,.12)",
            background: "rgba(0,0,0,.35)",
            color: "#fff",
            padding: "0 14px",
            fontSize: 16,
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") fetchData(1, q);
          }}
        />

        <button
          onClick={() => fetchData(1, q)}
          style={{
            height: 46,
            padding: "0 18px",
            borderRadius: 12,
            background: "#ff7a00",
            color: "#000",
            fontWeight: 900,
            border: "1px solid rgba(255,255,255,.15)",
            cursor: "pointer",
            minWidth: 110,
          }}
        >
          Buscar
        </button>

        <button
          onClick={() => {
            setQ("");
            fetchData(1, "");
          }}
          style={{
            height: 46,
            padding: "0 18px",
            borderRadius: 12,
            background: "rgba(255,255,255,.06)",
            color: "#fff",
            fontWeight: 900,
            border: "1px solid rgba(255,255,255,.12)",
            cursor: "pointer",
            minWidth: 110,
          }}
        >
          Limpiar
        </button>
      </div>

      <div style={{ marginTop: 10, opacity: 0.8 }}>
        Enviados: <b>{count}</b> &nbsp;&nbsp; Página: <b>{page}</b> / <b>{pages}</b>
      </div>

      {err ? <div style={{ marginTop: 10, color: "#ff4d4d", fontWeight: 900 }}>ERROR: {err}</div> : null}

      <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button
          onClick={() => canPrev && fetchData(page - 1, q)}
          disabled={!canPrev || loading}
          style={{
            height: 40,
            padding: "0 16px",
            borderRadius: 12,
            background: "rgba(255,255,255,.06)",
            color: "#fff",
            fontWeight: 900,
            border: "1px solid rgba(255,255,255,.12)",
            cursor: !canPrev || loading ? "not-allowed" : "pointer",
            opacity: !canPrev || loading ? 0.5 : 1,
          }}
        >
          Anterior
        </button>

        <button
          onClick={() => canNext && fetchData(page + 1, q)}
          disabled={!canNext || loading}
          style={{
            height: 40,
            padding: "0 16px",
            borderRadius: 12,
            background: "rgba(255,255,255,.06)",
            color: "#fff",
            fontWeight: 900,
            border: "1px solid rgba(255,255,255,.12)",
            cursor: !canNext || loading ? "not-allowed" : "pointer",
            opacity: !canNext || loading ? 0.5 : 1,
          }}
        >
          Siguiente
        </button>
      </div>

      <div style={{ marginTop: 14, borderRadius: 14, border: "1px solid rgba(255,255,255,.12)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "rgba(255,255,255,.04)" }}>
            <tr>
              <th style={{ textAlign: "left", padding: 12, fontWeight: 900 }}>ID</th>
              <th style={{ textAlign: "left", padding: 12, fontWeight: 900 }}>Nota</th>
              <th style={{ textAlign: "left", padding: 12, fontWeight: 900 }}>Posición</th>
              <th style={{ textAlign: "left", padding: 12, fontWeight: 900 }}>Bultos</th>
              <th style={{ textAlign: "left", padding: 12, fontWeight: 900 }}>Cliente</th>
              <th style={{ textAlign: "left", padding: 12, fontWeight: 900 }}>Enviado</th>
              <th style={{ textAlign: "left", padding: 12, fontWeight: 900 }}>Acción</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: 18, opacity: 0.8 }}>
                  Cargando...
                </td>
              </tr>
            ) : rows.length ? (
              rows.map((r) => (
                <tr key={r.id} style={{ borderTop: "1px solid rgba(255,255,255,.08)" }}>
                  <td style={{ padding: 12, opacity: 0.9 }}>{r.id}</td>
                  <td style={{ padding: 12, fontWeight: 900 }}>{r.nota}</td>
                  <td style={{ padding: 12, fontWeight: 900 }}>{r.posicion}</td>
                  <td style={{ padding: 12 }}>{r.bultos}</td>
                  <td style={{ padding: 12 }}>{r.cliente}</td>
                  <td style={{ padding: 12 }}>{fmt(r.enviadoAt)}</td>
                  <td style={{ padding: 12 }}>
                    <button
                      onClick={() => devolver(r.id, r.nota)}
                      style={{
                        height: 36,
                        padding: "0 12px",
                        borderRadius: 10,
                        background: "rgba(255,255,255,.06)",
                        color: "#fff",
                        fontWeight: 900,
                        border: "1px solid rgba(255,255,255,.12)",
                        cursor: "pointer",
                      }}
                    >
                      Devolver
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ padding: 18, opacity: 0.8 }}>
                  Sin registros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
