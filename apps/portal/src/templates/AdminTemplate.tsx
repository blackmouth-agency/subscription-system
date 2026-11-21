import type { ReactNode } from "react";

export default function AdminTemplate({ children }: { children?: ReactNode }) {
  return (
    <section aria-label="Administración">
      <h2>Administración</h2>
      <nav>
        <a href="/admin/products">Productos</a>
      </nav>
      {children}
    </section>
  );
}
