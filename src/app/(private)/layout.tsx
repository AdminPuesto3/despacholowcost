import Link from "next/link";
import Image from "next/image";

const tabs = [
  { href: "/despacho", label: "Despacho" },
  { href: "/pendiente-guardado", label: "Pendiente Guardado" },
  { href: "/pedido-enviado", label: "Pedido Enviado" },
  { href: "/posiciones", label: "Posiciones" },
  { href: "/perfil", label: "Perfil" },
];

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="ui-topbar">
        <div className="ui-topbar-inner">
          <Link href="/" className="ui-brand" aria-label="Inicio">
            <Image
              src="/logo.png"
              alt="LOWCOST"
              width={170}
              height={46}
              priority
              style={{ height: "auto", width: "auto" }}
            />
          </Link>

          <nav className="ui-tabs" aria-label="Navegación">
            {tabs.map((t) => (
              <Link key={t.href} href={t.href} className="ui-tab">
                {t.label}
              </Link>
            ))}
          </nav>

          <a className="ui-tab ui-tab-danger" href="/api/logout">
            Cerrar sesión
          </a>
        </div>

        <div className="ui-topbar-accent" />
      </header>

      <main className="ui-main">
        <div className="ui-container">{children}</div>
      </main>
    </div>
  );
}
