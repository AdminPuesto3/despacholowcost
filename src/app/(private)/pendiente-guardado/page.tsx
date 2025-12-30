"use client";

import { useEffect, useMemo, useState } from "react";

type Row = {
  id: number;
  notasRaw: string;
  bultos: number;
  operador: string | null;
  cliente: string | null;
  finalizadoAt: string | null;
};

function fmtAR(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-AR", { hour12: false });
}

export default function PendienteGuardadoPage() {
  const TAKE = 200;

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState<Row[]>([]);
  const [count, setCount] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canPrev = page > 1;
  const canNext = page < pages;

  async function load(p: number, query: string) {
    setLoading(true);
    setErr(null);
    try {
      const qs = new URLSearchParams();
      qs.set("take", String(TAKE));
      qs.set("page", String(p));
      if (query.trim()) qs.set("q", query.trim());

      const res = await fetch(`/api/pendiente/list?${qs.toString()}`, {
        method: "GET",
        credentials: "include",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      setRows(data.rows || []);
      setCount(Number(data.count || 0));
      setPages(Number(data.pages || 1));
    } catch (e: any) {
      setRows([]);
      setCount(0);
      setPages(1);
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subtitle = useMemo(() => {
    return `Podés buscar por NOTA (ej: 60113 o 60795/60796/60797) o por CLIENTE (ej: pebbles). Paginado: ${TAKE} por página.`;
  }, []);

  function onBuscar() {
    const p = 1;
    setPage(p);
    load(p, q);
  }

  function onLimpiar() {
    setQ("");
    const p = 1;
    setPage(p);
    load(p, "");
  }

  function prev() {
    if (!canPrev || loading) return;
    const p = page - 1;
    setPage(p);
    load(p, q);
  }

  function next() {
    if (!canNext || loading) return;
    const p = page + 1;
    setPage(p);
    load(p, q);
  }

  return (
    <div style={{ padding: 28 }}>
      <h1 style={{ fontSize: 42, fontWeight: 800, marginBottom: 6 }}>
        Pendiente Guardado
      </h1>
      <div style={{ opacity: 0.8, marginBottom: 18 }}>
        Registro de notas finalizadas (viene del Sheets vía sincronización).
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar / Escanear (ej: 60113 o 60795/60796/60797) o cliente (ej: pebbles)"
          style={{
            flex: 1,
            height: 52,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(0,0,0,0.35)",
            color: "white",
            padding: "0 16px",
            fontSize: 18,
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") onBuscar();
          }}
        />

        <button
          onClick={onBuscar}
          style={{
            height: 52,
            padding: "0 18px",
            borderRadius: 12,
            background: "#f57c00",
            color: "black",
            fontWeight: 800,
            border: "none",
            cursor: "pointer",
            minWidth: 110,
          }}
        >
          Buscar
        </button>

        <button
          onClick={onLimpiar}
          style={{
            height: 52,
            padding: "0 18px",
            borderRadius: 12,
            background: "transparent",
            color: "white",
            fontWeight: 700,
            border: "1px solid rgba(255,255,255,0.25)",
            cursor: "pointer",
            minWidth: 110,
          }}
        >
          Limpiar
        </button>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div style={{ opacity: 0.85 }}>{subtitle}</div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ opacity: 0.9, fontWeight: 700 }}>
            Pendientes: {count} &nbsp; Páginas: {pages} &nbsp; Página {page}
          </div>

          <button
            onClick={prev}
            disabled={!canPrev || loading}
            style={{
              height: 40,
              padding: "0 14px",
              borderRadius: 10,
              background:
                canPrev && !loading
                  ? "transparent"
                  : "rgba(255,255,255,0.06)",
              color:
                canPrev && !loading ? "white" : "rgba(255,255,255,0.35)",
              fontWeight: 700,
              border: "1px solid rgba(255,255,255,0.18)",
              cursor: canPrev && !loading ? "pointer" : "default",
            }}
          >
            Anterior
          </button>

          <button
            onClick={next}
            disabled={!canNext || loading}
            style={{
              height: 40,
              padding: "0 14px",
              borderRadius: 10,
              background:
                canNext && !loading ? "#f57c00" : "rgba(255,255,255,0.06)",
              color: canNext && !loading ? "black" : "rgba(255,255,255,0.35)",
              fontWeight: 800,
              border: "none",
              cursor: canNext && !loading ? "pointer" : "default",
            }}
          >
            Siguiente
          </button>
        </div>
      </div>

      {err && (
        <div style={{ color: "#ff5252", fontWeight: 800, margin: "10px 0" }}>
          {err}
        </div>
      )}

      <div
        style={{
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.12)",
          overflow: "hidden",
          background: "rgba(0,0,0,0.35)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.04)" }}>
              <th style={{ textAlign: "left", padding: 12 }}>ID</th>
              <th style={{ textAlign: "left", padding: 12 }}>Nota</th>
              <th style={{ textAlign: "left", padding: 12 }}>Bultos</th>
              <th style={{ textAlign: "left", padding: 12 }}>Operador</th>
              <th style={{ textAlign: "left", padding: 12 }}>Cliente</th>
              <th style={{ textAlign: "left", padding: 12 }}>Finalizado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: 16, opacity: 0.8 }}>
                  Cargando...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 16, opacity: 0.8 }}>
                  Sin registros.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.id}
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <td style={{ padding: 12 }}>{r.id}</td>
                  <td style={{ padding: 12, fontWeight: 800 }}>{r.notasRaw}</td>
                  <td style={{ padding: 12 }}>{r.bultos}</td>
                  <td style={{ padding: 12 }}>{r.operador || ""}</td>
                  <td style={{ padding: 12 }}>{r.cliente || ""}</td>
                  <td style={{ padding: 12 }}>{fmtAR(r.finalizadoAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
