import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import FormField from "../molecules/FormField";
import { noFilters } from "../lib/collections";
import { statusLabels } from "../lib/format";
import type { Filters, View } from "../types";
import Modal from "./Modal";

type Option = { value: string; label: string };

// «Filtrar cobros». Los cambios se aplican al instante; el botón principal
// solo cierra. En el mapa no hay Desde ni Hasta (siempre son 12 meses).
export default function FiltersModal({
  open,
  view,
  filters,
  products,
  clients,
  matches,
  onChange,
  onClose,
}: {
  open: boolean;
  view: View;
  filters: Filters;
  products: Option[];
  clients: Option[];
  // Cobros que dejan los filtros actuales.
  matches: number;
  onChange: (filters: Filters) => void;
  onClose: () => void;
}) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });
  const none = (Object.keys(noFilters) as (keyof Filters)[]).every(
    (k) => !filters[k],
  );
  return (
    <Modal open={open} title="Filtrar cobros" onClose={onClose}>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <FormField label="Estado">
            {(p) => (
              <NativeSelect
                {...p}
                value={filters.status}
                onChange={(e) => set({ status: e.target.value as never })}
              >
                <option value="">Todos</option>
                {(["paid", "pending", "overdue"] as const).map((s) => (
                  <option key={s} value={s}>
                    {statusLabels[s]}
                  </option>
                ))}
              </NativeSelect>
            )}
          </FormField>
        </div>
        <div className="col-span-2">
          <FormField label="Producto">
            {(p) => (
              <NativeSelect
                {...p}
                value={filters.productId}
                onChange={(e) => set({ productId: e.target.value })}
              >
                <option value="">Todos</option>
                {products.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </NativeSelect>
            )}
          </FormField>
        </div>
        <div className="col-span-2">
          <FormField label="Cliente">
            {(p) => (
              <NativeSelect
                {...p}
                value={filters.clientId}
                onChange={(e) => set({ clientId: e.target.value })}
              >
                <option value="">Todos</option>
                {clients.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </NativeSelect>
            )}
          </FormField>
        </div>
        {view === "list" && (
          <>
            <FormField label="Desde">
              {(p) => (
                <Input
                  {...p}
                  type="date"
                  value={filters.from}
                  max={filters.to || undefined}
                  onChange={(e) => set({ from: e.target.value })}
                />
              )}
            </FormField>
            <FormField label="Hasta">
              {(p) => (
                <Input
                  {...p}
                  type="date"
                  value={filters.to}
                  min={filters.from || undefined}
                  onChange={(e) => set({ to: e.target.value })}
                />
              )}
            </FormField>
          </>
        )}
      </div>
      <footer className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          disabled={none}
          onClick={() => onChange({ ...noFilters })}
        >
          Quitar filtros
        </Button>
        <Button onClick={onClose}>
          Ver <span className="num">{matches}</span>{" "}
          {matches === 1 ? "cobro" : "cobros"}
        </Button>
      </footer>
    </Modal>
  );
}
