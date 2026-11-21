import type { ReactNode } from "react";

export default function AdminTemplate({ children }: { children?: ReactNode }) {
  return (
    <section aria-label="Administración">
      <h2>Administración</h2>
      <nav>
        <a href="/admin/products">Productos</a>
        <a href="/admin/clients">Clientes</a>
      </nav>
      {children}
    </section>
  );
}
