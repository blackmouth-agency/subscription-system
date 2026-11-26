import Avatar from "boring-avatars";
import {
  Banknote,
  Handshake,
  LogOut,
  Package,
  Repeat,
  Menu,
  Users,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";

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
  const [open, setOpen] = useState(false);
  return (
    <section aria-label="Administración" className="marco @container/app">
      <aside data-open={open}>
        <div className="cabecera">
          <h1>
            <img src="/logo.png" alt="" />
            <span>
              BlackMouth
              <small>Portal de Pagos</small>
            </span>
          </h1>
          <button
            type="button"
            className="menu"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
        <div className="panel">
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
            <button
              type="button"
              aria-label="Cerrar sesión"
              onClick={onSignOut}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
      <div className="columna">{children}</div>
    </section>
  );
}
