import Avatar from "boring-avatars";
import {
  Banknote,
  Handshake,
  LogOut,
  Package,
  Repeat,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";

const links = [
  ["/admin/products", "Productos", Package],
  ["/admin/clients", "Clientes", Users],
  ["/admin/partners", "Socios", Handshake],
  ["/admin/subscriptions", "Suscripciones", Repeat],
  ["/admin/payments", "Cobros", Banknote],
] as const;

export default function AdminTemplate({
  email,
  onProfile,
  onSignOut,
  children,
}: {
  email: string;
  onProfile: () => void;
  onSignOut: () => void;
  children?: ReactNode;
}) {
  return (
    <section aria-label="Administración" className="marco @container/app">
      <aside>
        <h1>
          <img src="/logo.png" alt="" />
          <span>
            BlackMouth
            <small>Portal de Pagos</small>
          </span>
        </h1>
        <nav>
          {links.map(([href, label, Icon]) => (
            <a
              key={href}
              href={href}
              aria-current={
                window.location.pathname === href ? "page" : undefined
              }
            >
              <Icon size={16} aria-hidden="true" />
              {label}
            </a>
          ))}
        </nav>
        <div className="usuario">
          <button type="button" aria-label="Mi perfil" onClick={onProfile}>
            <Avatar name={email} variant="beam" size={32} />
            <span title={email}>{email}</span>
          </button>
          <button type="button" aria-label="Cerrar sesión" onClick={onSignOut}>
            <LogOut size={16} />
          </button>
        </div>
      </aside>
      <div className="columna">{children}</div>
    </section>
  );
}
