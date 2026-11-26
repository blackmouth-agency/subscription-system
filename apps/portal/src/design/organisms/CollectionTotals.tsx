import { Skeleton } from "@/components/ui/skeleton";
import { cx } from "../lib/cx";
import { formatCop } from "../lib/format";
import type { CollectionStatus } from "../types";

export type Total = {
  status: CollectionStatus;
  amount: number;
  count: number;
  percent: number;
};

const names: Record<CollectionStatus, string> = {
  paid: "Cobrado",
  pending: "Pendiente",
  overdue: "Vencido",
};
const strokes: Record<CollectionStatus, string> = {
  paid: "stroke-hecho",
  pending: "stroke-azul",
  overdue: "stroke-oxido",
};
const order = ["paid", "pending", "overdue"] as const;

// Anillo con el porcentaje; pathLength=100 evita calcular la circunferencia.
function Ring({
  status,
  percent,
}: {
  status: CollectionStatus;
  percent: number;
}) {
  return (
    <div className="relative size-14 flex-none">
      <svg
        viewBox="0 0 36 36"
        aria-hidden="true"
        className="size-full -rotate-90 fill-none"
        strokeWidth="3.5"
      >
        <circle cx="18" cy="18" r="15.9" className="stroke-realce" />
        <circle
          cx="18"
          cy="18"
          r="15.9"
          pathLength="100"
          strokeDasharray={`${percent} 100`}
          strokeLinecap="round"
          className={strokes[status]}
        />
      </svg>
      <span
        className={cx(
          "num absolute inset-0 grid place-items-center text-pequeno",
        )}
      >
        {percent}%
      </span>
    </div>
  );
}

// Cobrado · Pendiente · Vencido: anillo, cifra y cantidad de mensualidades.
export default function CollectionTotals({
  totals,
  loading,
}: {
  totals: Total[];
  loading?: boolean;
}) {
  return (
    <section
      aria-label="Totales"
      aria-busy={loading || undefined}
      className="grid grid-cols-1 gap-4 min-[861px]:grid-cols-3"
    >
      {order.map((status) => {
        const t = totals.find((x) => x.status === status);
        return (
          <div
            key={status}
            className={cx(
              "flex items-center gap-4 rounded-tarjeta bg-superficie px-4 py-3",
            )}
          >
            {loading || !t ? (
              <Skeleton className="size-14 flex-none rounded-full" />
            ) : (
              <Ring status={status} percent={t.percent} />
            )}
            <div
              className={cx(
                "grid content-center gap-0.5 border-l pl-4 border-realce",
              )}
            >
              <p className="text-tenue">{names[status]}</p>
              {loading || !t ? (
                <>
                  <Skeleton className="h-6.5 w-32" />
                  <Skeleton className="w-24" />
                </>
              ) : (
                <>
                  <p className="num text-cifra">{formatCop(t.amount)}</p>
                  <p className="text-pequeno text-tenue">
                    <span className="num">{t.count}</span>{" "}
                    {t.count === 1 ? "mensualidad" : "mensualidades"}
                  </p>
                </>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
