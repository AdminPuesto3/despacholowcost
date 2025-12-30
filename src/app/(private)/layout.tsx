import Link from "next/link";
import Image from "next/image";

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link
    href={href}
    className="block px-3 py-2 rounded-lg hover:bg-zinc-900 border border-transparent hover:border-zinc-800 text-sm"
  >
    {children}
  </Link>
);

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Topbar MOBILE */}
      <div className="md:hidden sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur">
        <div className="flex items-center justify-between px-3 py-2">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="LOWCOST"
              width={120}
              height={34}
              priority
              style={{ height: "auto", width: "auto" }}
            />
            <span className="text-[11px] opacity-70 leading-none">WMS Despacho</span>
          </Link>

          <details className="relative">
            <summary className="list-none cursor-pointer select-none px-3 py-2 rounded-lg border border-white/15 bg-white/5 font-extrabold text-sm">
              Menú
            </summary>
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-black shadow-xl p-2">
              <NavLink href="/despacho">Despacho</NavLink>
              <NavLink href="/pendiente-guardado">Pendiente Guardado</NavLink>
              <NavLink href="/pedido-enviado">Pedido Enviado</NavLink>
              <NavLink href="/posiciones">Posiciones</NavLink>
              <NavLink href="/perfil">Perfil</NavLink>
            </div>
          </details>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar DESKTOP (más angosto) */}
        <aside className="hidden md:block w-60 border-r border-white/10 px-4 py-4">
          <Link href="/" className="block mb-5">
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="LOWCOST"
                width={140}
                height={40}
                priority
                style={{ height: "auto", width: "auto" }}
              />
              <div className="text-xs opacity-70 leading-none">WMS Despacho</div>
            </div>
          </Link>

          <nav className="flex flex-col gap-1.5">
            <NavLink href="/despacho">Despacho</NavLink>
            <NavLink href="/pendiente-guardado">Pendiente Guardado</NavLink>
            <NavLink href="/pedido-enviado">Pedido Enviado</NavLink>
            <NavLink href="/posiciones">Posiciones</NavLink>
            <NavLink href="/perfil">Perfil</NavLink>
          </nav>
        </aside>

        {/* Contenido (centrado y con ancho máximo) */}
        <main className="flex-1 px-4 md:px-6 py-5">
          <div className="mx-auto w-full max-w-[1400px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
