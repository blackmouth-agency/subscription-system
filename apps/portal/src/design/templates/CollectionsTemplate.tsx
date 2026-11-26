import type { ReactNode } from "react";
import { cx } from "../lib/cx";
// Cobros: aviso, totales y la tarjeta principal.
// Solo coloca; no lleva datos ni lógica.
export default function CollectionsTemplate({
  action,
  notice,
  totals,
  children,
}: {
  action?: ReactNode;
  notice?: ReactNode;
  totals?: ReactNode;
  children: ReactNode;
}) {
  return (
    // En escritorio ocupa la altura de la ventana menos el relleno de
    // `.marco` (48); la tarjeta absorbe lo que sobra: sin barras de scroll.
    // El título mide 32 y el hueco es 12, igual que logo y nav del navbar.
    <div
      data-design
      className={cx(
        "flex min-w-0 flex-col gap-3",
        "min-[861px]:h-[calc(100svh-48px)]",
      )}
    >
      <div className="flex min-h-8 items-center justify-between gap-4">
        <h2 className="text-titulo">Cobros</h2>
        {action}
      </div>
      {notice}
      {totals}
      <section
        aria-label="Cobros"
        className={cx(
          "flex min-h-0 min-w-0 flex-1 flex-col rounded-tarjeta",
          "bg-superficie min-[861px]:overflow-hidden",
        )}
      >
        {children}
      </section>
    </div>
  );
}
