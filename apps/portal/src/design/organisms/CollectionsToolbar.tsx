import { LayoutGrid, List } from "lucide-react";
import { cx } from "../lib/cx";
import Node from "../atoms/Node";
import FiltersButton from "../molecules/FiltersButton";
import SearchBox from "../molecules/SearchBox";
import ViewSelect from "../molecules/ViewSelect";
import type { View } from "../types";

const views = [
  { value: "list", label: "Lista", icon: List },
  { value: "map", label: "Mapa", icon: LayoutGrid },
];

// `[Lista | Mapa]` · leyenda (solo mapa) · `[buscador][filtros]`.
export default function CollectionsToolbar({
  view,
  query,
  applied,
  onView,
  onQuery,
  onFilters,
}: {
  view: View;
  query: string;
  applied: number;
  onView: (view: View) => void;
  onQuery: (query: string) => void;
  onFilters: () => void;
}) {
  return (
    <header
      className={cx(
        "flex min-h-15 flex-wrap items-center gap-x-4 gap-y-3",
        "px-5 py-3",
      )}
    >
      <div className="flex min-w-0 items-center gap-2 @max-movil/app:w-full">
        <SearchBox
          label="Buscar clientes"
          placeholder="Buscar cliente"
          value={query}
          onChange={onQuery}
        />
        <FiltersButton applied={applied} onClick={onFilters} />
      </div>
      <div className="ml-auto flex items-center gap-4">
        {view === "map" && (
          <ul className="m-0 flex list-none gap-4 p-0 text-pequeno">
            {(
              [
                ["paid", "Pagada"],
                ["pending", "Pendiente"],
                ["overdue", "Vencida"],
              ] as const
            ).map(([status, label]) => (
              <li key={status} className="flex items-center gap-1.5">
                <Node status={status} />
                {label}
              </li>
            ))}
          </ul>
        )}
        <ViewSelect
          label="Vista"
          value={view}
          options={views}
          onChange={(v) => onView(v as View)}
        />
      </div>
    </header>
  );
}
