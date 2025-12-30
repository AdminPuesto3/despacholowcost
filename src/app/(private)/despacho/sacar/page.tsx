"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type Found = {
  id: number;
  nota: string;
  posicion: string;
  bultos: number;
  cliente: string;
  finalizadoAt: string | null;
};

type ItemLista = {
  nota: string;
  posicion: string;
  bultos: number;
  cliente: string;
};

function fmtDate(v: any) {
  if (!v) return "";
  try {
    return new Date(v).toLocaleString("es-AR");
  } catch {
    return String(v);
  }
}

export default function SacarPedidoPage() {
  const [nota, setNota] = useState("");
  const [found, setFound] = useState<Found | null>(null);

  const [scanBulto, setScanBulto] = useState("");
  const [scannedCount, setScannedCount] = useState(0);

  const [lista, setLista] = useState<ItemLista[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  const bultosEsperados = useMemo(() => Number(found?.bultos || 0), [found]);

  const completo = useMemo(
    () => bultosEsperados > 0 && scannedCount === bultosEsperados,
    [scannedCount, bultosEsperados]
  );

  const bultoRef = useRef<HTMLInputElement | null>(null);
  const notaRef = useRef<HTMLInputElement | null>(null);

  async function buscarNota() {
    const n = String(nota || "").trim();

    setErr("");
    setFound(null);
    setScannedCount(0);
    setScanBulto("");

    if (!n) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/despacho/sacar/buscar?nota=${encodeURIComponent(n)}`, {
        credentials: "include",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `HTTP_${res.status}`);
      }

      setFound(data.row as Found);
      setTimeout(() => bultoRef.current?.focus(), 0);
    } catch (e: any) {
      setErr(e?.message || "ERROR_INTERNO");
      setFound(null);
      setTimeout(() => notaRef.current?.focus(), 0);
    } finally {
      setLoading(false);
    }
  }

  function resetConteo(msg: string) {
    setScannedCount(0);
    setScanBulto("");
    setErr(msg);
    setTimeout(() => bultoRef.current?.focus(), 0);
  }

  function onScanBultoSubmit() {
    setErr("");

    if (!found) {
      setErr("FALTA_NOTA");
      notaRef.current?.focus();
      return;
    }

    if (!bultosEsperados || bultosEsperados <= 0) {
      setErr("BULTOS_INVALIDOS");
      return;
    }

    const code = String(scanBulto || "").trim();
    if (!code) return;

    const next = scannedCount + 1;

    // ✅ si se pasa: reset total del pedido
    if (next > bultosEsperados) {
      resetConteo("TE_PASASTE_DE_BULTOS (se reseteó el conteo)");
      return;
    }

    setScannedCount(next);
    setScanBulto("");
    setTimeout(() => bultoRef.current?.focus(), 0);
  }

  function agregarALista() {
    setErr("");

    if (!found) return setErr("FALTA_NOTA");
    if (!bultosEsperados || bultosEsperados <= 0) return setErr("BULTOS_INVALIDOS");
    if (scannedCount !== bultosEsperados) return setErr("FALTAN_BULTOS");

    const item: ItemLista = {
      nota: String(found.nota || "").trim(),
      posicion: String(found.posicion || "").trim(),
      bultos: Number(found.bultos || 0),
      cliente: found.cliente || "",
    };

    setLista((prev) => {
      if (prev.some((x) => x.nota === item.nota)) return prev;
      return [item, ...prev];
    });

    setFound(null);
    setNota("");
    setScanBulto("");
    setScannedCount(0);

    setTimeout(() => notaRef.current?.focus(), 0);
  }

  async function enviarPedidos() {
    setErr("");
    if (!lista.length) return;

    setSending(true);
    try {
      const res = await fetch("/api/despacho/sacar/enviar", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: lista }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `HTTP_${res.status}`);
      }

      setLista([]);
      setErr("");
    } catch (e: any) {
      setErr(e?.message || "ERROR_INTERNO");
    } finally {
      setSending(false);
    }
  }

  function quitar(n: string) {
    setLista((prev) => prev.filter((x) => x.nota !== n));
  }

  useEffect(() => {
    notaRef.current?.focus();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: 54, fontWeight: 800, margin: 0 }}>Sacar pedido</h1>
          <div style={{ marginTop: 6, opacity: 0.85 }}>
            Escaneá NOTA (ubicada), luego escaneá bultos hasta completar, y agregá a la lista. Al final “Enviar”.
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
          }}
        >
          Volver a Despacho
        </Link>
      </div>

      <div style={{ marginTop: 18, display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>1) NOTA (scan o escribir)</div>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              ref={notaRef}
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && buscarNota()}
              placeholder="Ej: 61071"
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
              onClick={buscarNota}
              disabled={loading || !nota.trim()}
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
                opacity: loading || !nota.trim() ? 0.6 : 1,
              }}
            >
              {loading ? "Buscando..." : "Buscar"}
            </button>
          </div>

          {found ? (
            <div
              style={{
                marginTop: 12,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.18)",
                padding: 14,
              }}
            >
              <div style={{ fontWeight: 900, marginBottom: 8 }}>Datos</div>
              <div style={{ lineHeight: 1.65 }}>
                <div><b>Nota:</b> {found.nota}</div>
                <div><b>Posición:</b> {found.posicion}</div>
                <div><b>Cliente:</b> {found.cliente}</div>
                <div><b>Bultos:</b> {found.bultos}</div>
                <div><b>Finalizado:</b> {fmtDate(found.finalizadoAt)}</div>
              </div>
            </div>
          ) : null}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>2) Escaneo de bultos</div>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              ref={bultoRef}
              value={scanBulto}
              onChange={(e) => setScanBulto(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onScanBultoSubmit()}
              placeholder="Escaneá bulto y Enter"
              disabled={!found}
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
                opacity: found ? 1 : 0.55,
              }}
            />
            <button
              onClick={agregarALista}
              disabled={!found || !completo}
              style={{
                height: 44,
                padding: "0 18px",
                borderRadius: 14,
                background: "#f38b00",
                color: "black",
                fontWeight: 900,
                border: "none",
                cursor: "pointer",
                minWidth: 160,
                opacity: !found || !completo ? 0.6 : 1,
              }}
            >
              Agregar a lista
            </button>
          </div>

          <div style={{ marginTop: 10, opacity: 0.85 }}>
            Progreso: <b>{scannedCount}</b> / <b>{bultosEsperados || 0}</b>
            {completo ? <span style={{ marginLeft: 10, fontWeight: 900 }}>(OK)</span> : null}
          </div>
        </div>
      </div>

      {err ? (
        <div style={{ marginTop: 12, color: "#ff4d4d", fontWeight: 900 }}>
          ERROR: {err}
        </div>
      ) : null}

      <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 900 }}>Listo para enviar: {lista.length}</div>
        <button
          onClick={enviarPedidos}
          disabled={!lista.length || sending}
          style={{
            height: 44,
            padding: "0 18px",
            borderRadius: 14,
            background: "#f38b00",
            color: "black",
            fontWeight: 900,
            border: "none",
            cursor: !lista.length ? "not-allowed" : "pointer",
            opacity: !lista.length || sending ? 0.6 : 1,
          }}
        >
          {sending ? "Enviando..." : "Enviar pedidos"}
        </button>
      </div>

      <div style={{ marginTop: 10, borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", overflow: "hidden" }}>
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
            {!lista.length ? (
              <tr>
                <td colSpan={5} style={{ padding: 14, opacity: 0.7 }}>
                  Sin registros.
                </td>
              </tr>
            ) : (
              lista.map((x) => (
                <tr key={x.nota} style={{ borderTop: "1px solid rgba(255,255,255,.08)" }}>
                  <td style={{ padding: 12, fontWeight: 900 }}>{x.nota}</td>
                  <td style={{ padding: 12, fontWeight: 900 }}>{x.posicion}</td>
                  <td style={{ padding: 12 }}>{x.cliente}</td>
                  <td style={{ padding: 12, textAlign: "right", fontWeight: 900 }}>{x.bultos}</td>
                  <td style={{ padding: 12, textAlign: "right" }}>
                    <button
                      onClick={() => quitar(x.nota)}
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

        <div style={{ padding: 12, opacity: 0.7 }}>
          Tip: si te pasás de bultos, se resetea el conteo de ese pedido.
        </div>
      </div>
    </div>
  );
}
