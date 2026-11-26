import type { LucideIcon } from "lucide-react";
import { cx } from "../lib/cx";

type Option = {
  value: string;
  label: string;
  count?: number;
  icon?: LucideIcon;
};

// Grupo de chips de un solo valor: activo = fondo y peso, no solo color.
export default function FilterChips({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex min-w-0 gap-1 overflow-x-auto"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={cx(
            "inline-flex min-h-8.5 flex-none items-center gap-1.5",
            "rounded-chip px-3 text-tenue",
            "hover:text-tinta focus-visible:-outline-offset-2",
            "aria-pressed:bg-activo aria-pressed:font-medium",
            "aria-pressed:text-tinta @max-movil/app:min-h-11",
          )}
        >
          {o.icon && (
            <o.icon aria-hidden="true" strokeWidth={1.6} className="size-4" />
          )}
          {o.label}
          {o.count !== undefined && (
            <span className="num ml-1.5 text-tenue">{o.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
