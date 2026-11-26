import { useId } from "react";
import { cx } from "../lib/cx";
import Node from "../atoms/Node";
import { formatCop } from "../lib/format";
import type { InstallmentStatus } from "../types";

type Item = {
  id: string;
  label: string;
  status: InstallmentStatus;
  amount: number;
};

// Mensualidades que cubre un pago: solo completas, de la más antigua a la
// más nueva. `count` = cuántas, contando desde la primera de la lista.
export default function CoverageList({
  items,
  count,
  onChange,
}: {
  items: Item[];
  count: number;
  onChange: (count: number) => void;
}) {
  const hint = useId();
  return (
    <fieldset aria-describedby={hint} className="m-0 grid gap-1 border-0 p-0">
      <legend className="pb-1.5 font-medium">Mensualidades que cubre</legend>
      {items.map((item, i) => {
        const selected = i < count;
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(selected ? i : i + 1)}
            className={cx(
              "flex min-h-11 w-full items-center gap-3 rounded-control",
              "border border-linea px-3.5 text-left hover:border-borde",
              "aria-pressed:border-tinta aria-pressed:bg-realce",
            )}
          >
            <Node status={item.status} />
            <span>{item.label}</span>
            <span className="num ml-auto">{formatCop(item.amount)}</span>
          </button>
        );
      })}
      <span id={hint} className="sr-only">
        Solo mensualidades completas, de la más antigua a la más nueva.
      </span>
    </fieldset>
  );
}
