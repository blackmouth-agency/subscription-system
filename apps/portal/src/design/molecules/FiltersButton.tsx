import { SlidersHorizontal } from "lucide-react";
import { cx } from "../lib/cx";
import { Button } from "@/components/ui/button";

// Solo ícono; la insignia con el número avisa de filtros aplicados.
export default function FiltersButton({
  applied,
  onClick,
}: {
  applied: number;
  onClick: () => void;
}) {
  return (
    <Button
      variant="secondary"
      size="icon"
      className="relative @max-movil/app:min-w-11"
      aria-label={`Filtros, ${applied} aplicados`}
      onClick={onClick}
    >
      <SlidersHorizontal
        aria-hidden="true"
        strokeWidth={1.6}
        className="size-4.5"
      />
      {applied > 0 && (
        <span
          aria-hidden="true"
          className={cx(
            "num absolute -top-1.75 -right-1.75 h-5 min-w-5 rounded-full",
            "bg-azul px-1.25 text-center text-minimo text-fondo",
          )}
        >
          {applied}
        </span>
      )}
    </Button>
  );
}
