import Link from "next/link";
import { prisma } from "@/lib/prisma";

function cardStyle() {
  return {
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,.10)",
    background: "rgba(0,0,0,.25)",
    padding: 16,
  } as const;
}

export default async function HomePage() {
  const [ubicados, guardados, enviados] = await Promise.all([
    prisma.pendiente.count({ where: { positionId: { not: null } } }),
    prisma.pendiente.count({ where: { positionId: null } }),
    prisma.pedidoEnviado.count({}),
  ]);

  // “hoy”
  const today0 = new Date();
  today0.setHours(0, 0, 0, 0);

  const enviadosHoy = await prisma.pedidoEnviado.count({
    where: { enviadoAt: { gte: today0 } },
  });

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 46, fontWeight: 900, margin: 0 }}>WMS Despacho</h1>
          <div style={{ opacity: 0.75, marginTop: 6 }}>
            Resumen rápido (para que la raíz no quede vacía).
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/despacho" style={{
            height: 44, display: "inline-flex", alignItems: "center", justifyContent: "center",
            padding: "0 14px", borderRadius: 12, background: "#ff7a00", color: "#000",
            fontWeight: 900, textDecoration: "none", border: "1px solid rgba(255,255,255,.12)"
          }}>
            Ir a Despacho
          </Link>

          <Link href="/pedido-enviado" style={{
            height: 44, display: "inline-flex", alignItems: "center", justifyContent: "center",
            padding: "0 14px", borderRadius: 12, background: "rgba(255,255,255,.06)", color: "#fff",
            fontWeight: 900, textDecoration: "none", border: "1px solid rgba(255,255,255,.12)"
          }}>
            Pedido Enviado
          </Link>
        </div>
      </div>

      <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
        <div style={cardStyle()}>
          <div style={{ opacity: 0.8 }}>Ubicados (en DESPACHO)</div>
          <div style={{ fontSize: 34, fontWeight: 900, marginTop: 6 }}>{ubicados}</div>
        </div>

        <div style={cardStyle()}>
          <div style={{ opacity: 0.8 }}>Pendientes guardados (sin posición)</div>
          <div style={{ fontSize: 34, fontWeight: 900, marginTop: 6 }}>{guardados}</div>
        </div>

        <div style={cardStyle()}>
          <div style={{ opacity: 0.8 }}>Enviados (histórico)</div>
          <div style={{ fontSize: 34, fontWeight: 900, marginTop: 6 }}>{enviados}</div>
          <div style={{ marginTop: 8, opacity: 0.75 }}>Hoy: <b>{enviadosHoy}</b></div>
        </div>
      </div>

      <div style={{ marginTop: 16, ...cardStyle() }}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>Accesos rápidos</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/despacho/ubicar" style={{ color: "#fff", fontWeight: 900, textDecoration: "none", border: "1px solid rgba(255,255,255,.12)", borderRadius: 12, padding: "10px 12px", background: "rgba(255,255,255,.05)" }}>
            Ubicar pedido
          </Link>
          <Link href="/despacho/sacar" style={{ color: "#fff", fontWeight: 900, textDecoration: "none", border: "1px solid rgba(255,255,255,.12)", borderRadius: 12, padding: "10px 12px", background: "rgba(255,255,255,.05)" }}>
            Sacar pedido
          </Link>
          <Link href="/pedido-enviado" style={{ color: "#fff", fontWeight: 900, textDecoration: "none", border: "1px solid rgba(255,255,255,.12)", borderRadius: 12, padding: "10px 12px", background: "rgba(255,255,255,.05)" }}>
            Ver pedidos enviados
          </Link>
        </div>
      </div>
    </div>
  );
}
