"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Row = {
  id: number;
  nota: string;
  posicion: string;
  bultos: number;
  cliente: string;
  finalizadoAt: string | null;
};

const TAKE = 200;

function fmtDate(v: any) {
  if (!v) return "";
  try {
    const d = new Date(v);
    return d.toLocaleString();
  } catch {
    return String(v);
  }
}

export default function DespachoPage() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Row[]>([]);
  const [count, setCount] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const canPrev = useMemo(() => page > 1, [page]);
  const canNext = useMemo(() => page < pages, [page, pages]);

  async function load(p: number, qq: string) {
    setLoading(true);
    setErr("");
    try {
      const params = new URLSearchParams();
      params.set("take", String(TAKE));
      params.set("page", String(p));
      if (qq?.trim()) params.set("q", qq.trim());

      const res = await fetch(`/api/despacho/list?${params.toString()}`, {
        credentials: "include",
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "ERROR");
      }

      setRows(Array.isArray(data.rows) ? data.rows : []);
      setCount(Number(data.count || 0));
      setPages(Math.max(1, Number(data.pages || 1)));
      setPage(Math.max(1, Number(data.page || p)));
    } catch (e: any) {
      setRows([]);
      setCount(0);
      setPages(1);
      setErr(e?.message || "ERROR");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onBuscar() {
    load(1, q);
  }

  function onLimpiar() {
    setQ("");
    load(1, "");
  }

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "flex-start",
        }}
      >
        <div>
          <h1 style={{ fontSize: 54, fontWeight: 800, margin: 0 }}>Despacho</h1>
          <div style={{ marginTop: 6, opacity: 0.85 }}>
            Ubicados (con posición). Paginado: {TAKE} por página.
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link
            href="/despacho/ubicar"
            style={{
              height: 44,
              display: "inline-flex",
              alignItems: "center",
              padding: "0 18px",
              borderRadius: 14,
              background: "#f38b00",
              color: "black",
              fontWeight: 900,
              textDecoration: "none",
              border: "none",
            }}
          >
            Ubicar pedido
          </Link>

          <Link
            href="/despacho/sacar"
            style={{
              height: 44,
              display: "inline-flex",
              alignItems: "center",
              padding: "0 18px",
              borderRadius: 14,
              background: "#f38b00",
              color: "black",
              fontWeight: 900,
              textDecoration: "none",
              border: "none",
            }}
          >
            Sacar pedido
          </Link>
        </div>
      </div>

      <div style={{ marginTop: 18, display: "flex", gap: 12 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onBuscar();
          }}
          placeholder="Buscar por NOTA o CLIENTE (ej: 61071 o pebbles)"
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
          onClick={onBuscar}
          disabled={loading}
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
            opacity: loading ? 0.6 : 1,
          }}
        >
          Buscar
        </button>

        <button
          onClick={onLimpiar}
          disabled={loading}
          style={{
            height: 44,
            padding: "0 18px",
            borderRadius: 14,
            background: "transparent",
            color: "white",
            fontWeight: 900,
            border: "1px solid rgba(255,255,255,0.25)",
            cursor: "pointer",
            minWidth: 120,
            opacity: loading ? 0.6 : 1,
          }}
        >
          Limpiar
        </button>
      </div>

      <div style={{ marginTop: 10, opacity: 0.85, display: "flex", justifyContent: "space-between" }}>
        <div>
          Ubicados: <b>{count}</b>&nbsp;&nbsp; Páginas: <b>{pages}</b>
        </div>
        <div>
          Página <b>{page}</b>{" "}
          <button
            onClick={() => canPrev && load(page - 1, q)}
            disabled={!canPrev || loading}
            style={{
              marginLeft: 12,
              height: 34,
              padding: "0 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(0,0,0,0.35)",
              color: "white",
              cursor: "pointer",
              fontWeight: 800,
              opacity: !canPrev || loading ? 0.55 : 1,
            }}
          >
            Anterior
          </button>
          <button
            onClick={() => canNext && load(page + 1, q)}
            disabled={!canNext || loading}
            style={{
              marginLeft: 8,
              height: 34,
              padding: "0 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(0,0,0,0.35)",
              color: "white",
              cursor: "pointer",
              fontWeight: 800,
              opacity: !canNext || loading ? 0.55 : 1,
            }}
          >
            Siguiente
          </button>
        </div>
      </div>

      {err ? (
        <div style={{ marginTop: 12, color: "#ff4d4d", fontWeight: 900 }}>ERROR: {err}</div>
      ) : null}

      <div
        style={{
          marginTop: 12,
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.12)",
          overflow: "hidden",
          background: "rgba(0,0,0,0.18)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left" }}>
              <th style={{ padding: 14 }}>ID</th>
              <th style={{ padding: 14 }}>Nota</th>
              <th style={{ padding: 14 }}>Posición</th>
              <th style={{ padding: 14 }}>Bultos</th>
              <th style={{ padding: 14 }}>Cliente</th>
              <th style={{ padding: 14, textAlign: "right" }}>Finalizado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: 16, opacity: 0.8 }}>
                  Cargando...
                </td>
              </tr>
            ) : rows.length ? (
              rows.map((r) => (
                <tr key={r.id} style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <td style={{ padding: 14, width: 80 }}>{r.id}</td>
                  <td style={{ padding: 14, fontWeight: 900 }}>{r.nota}</td>
                  <td style={{ padding: 14, fontWeight: 900 }}>{r.posicion}</td>
                  <td style={{ padding: 14, fontWeight: 800 }}>{r.bultos}</td>
                  <td style={{ padding: 14 }}>{r.cliente}</td>
                  <td style={{ padding: 14, textAlign: "right", whiteSpace: "nowrap" }}>
                    {fmtDate(r.finalizadoAt)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ padding: 16, opacity: 0.8 }}>
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
