import Node from "../atoms/Node";
import type { InstallmentStatus } from "../types";

const names: Record<InstallmentStatus, string> = {
  paid: "pagadas",
  pending: "pendientes",
  overdue: "vencidas",
  none: "sin mensualidad",
};

// Recorrido: nodos en fila unidos por una línea (12 meses en el portal).
export default function Journey({
  statuses,
}: {
  statuses: InstallmentStatus[];
}) {
  const summary = (Object.keys(names) as InstallmentStatus[])
    .map((s) => [s, statuses.filter((x) => x === s).length] as const)
    .filter(([, n]) => n > 0)
    .map(([s, n]) => `${n} ${names[s]}`)
    .join(", ");
  return (
    <span
      role="img"
      aria-label={summary}
      className="relative inline-flex items-center gap-1 align-middle"
    >
      <span className="absolute inset-x-1.25 top-1/2 h-px bg-linea" />
      {statuses.map((s, i) => (
        <Node key={i} status={s} />
      ))}
    </span>
  );
}
