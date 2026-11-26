import { Check } from "lucide-react";
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
  const all = count === items.length;
  return (
    <fieldset aria-describedby={hint} className="m-0 grid gap-2 border-0 p-0">
      <div className="flex items-center justify-between gap-3 pb-0.5">
        <legend className="float-left font-medium">
          Mensualidades que cubre
        </legend>
        <button
          type="button"
          onClick={() => onChange(all ? 0 : items.length)}
          className="font-medium text-azul hover:underline"
        >
          {all ? "Desmarcar todas" : "Marcar todas"}
        </button>
      </div>
      {items.map((item, i) => {
        const selected = i < count;
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(selected ? i : i + 1)}
            className={cx(
              "group flex min-h-14 w-full items-center gap-3 rounded-control",
              "border border-linea px-3.5 py-2 text-left hover:border-borde",
              "aria-pressed:border-azul aria-pressed:bg-azul-tinte",
            )}
          >
            <span
              aria-hidden="true"
              className={cx(
                "grid size-5 flex-none place-items-center rounded-[6px]",
                "border border-borde group-aria-pressed:border-azul",
                "group-aria-pressed:bg-azul group-aria-pressed:text-fondo",
              )}
            >
              <Check
                strokeWidth={2.4}
                className="size-3.5 opacity-0 group-aria-pressed:opacity-100"
              />
            </span>
            <span className="grid min-w-0 flex-1 gap-0.5">
              <span className="font-medium">{item.label}</span>
              <span
                className={cx(
                  "flex items-center gap-1.5",
                  "text-minimo text-tenue",
                )}
              >
                <Node status={item.status} />
                {item.status === "overdue" ? "Vencida" : "Pendiente"}
              </span>
            </span>
            <span className="num flex-none">{formatCop(item.amount)}</span>
          </button>
        );
      })}
      <span id={hint} className="sr-only">
        Solo mensualidades completas, de la más antigua a la más nueva.
      </span>
    </fieldset>
  );
}
