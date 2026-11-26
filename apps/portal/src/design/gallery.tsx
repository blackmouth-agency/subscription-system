import { StrictMode, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./design.css";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "./atoms/Link";
import Node from "./atoms/Node";
import { Alert } from "@/components/ui/alert";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import CheckboxField from "./molecules/CheckboxField";
import CoverageList from "./molecules/CoverageList";
import DataList from "./molecules/DataList";
import FilterChips from "./molecules/FilterChips";
import FiltersButton from "./molecules/FiltersButton";
import FormField from "./molecules/FormField";
import Journey from "./molecules/Journey";
import SearchBox from "./molecules/SearchBox";
import { cx } from "./lib/cx";
import { noFilters, paginate, mapMonths } from "./lib/collections";
import { normalizeText } from "./lib/format";
import CollectionsMap, { toMapRows } from "./organisms/CollectionsMap";
import CollectionsTable from "./organisms/CollectionsTable";
import CollectionsToolbar from "./organisms/CollectionsToolbar";
import CollectionTotals from "./organisms/CollectionTotals";
import FiltersModal from "./organisms/FiltersModal";
import PaginationFooter from "./organisms/PaginationFooter";
import PaymentModal from "./organisms/PaymentModal";
import StatePanel from "./organisms/StatePanel";
import { sampleDebtors, sampleRows, sampleTotals } from "./sample";
import type { Filters, InstallmentStatus } from "./types";

const clients = ["Odontología Prado", "Panadería Don Tulio", "Gimnasio Norte"];
const journey: InstallmentStatus[] = [
  ...Array<InstallmentStatus>(10).fill("paid"),
  "overdue",
  "overdue",
];
const coverage = [
  { id: "oct", label: "Octubre 2026", status: "overdue", amount: 130000 },
  { id: "nov", label: "Noviembre 2026", status: "overdue", amount: 130000 },
  { id: "dic", label: "Diciembre 2026", status: "pending", amount: 130000 },
] satisfies {
  id: string;
  label: string;
  status: InstallmentStatus;
  amount: number;
}[];

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={card}>
      <h2 className="text-tarjeta">{title}</h2>
      {children}
    </section>
  );
}

const card = "grid content-start gap-4.5 rounded-tarjeta bg-superficie p-6";
const grid =
  "grid grid-cols-[repeat(auto-fit,minmax(min(20rem,100%),1fr))] gap-4";
const row = "flex flex-wrap items-center gap-2.5";

function Showcase() {
  const [query, setQuery] = useState("tulio");
  const [chip, setChip] = useState("all");
  const [covered, setCovered] = useState(1);
  const [page, setPage] = useState(5);
  const found = clients.filter((c) =>
    normalizeText(c).includes(normalizeText(query)),
  );
  return (
    <div className="grid gap-5 p-6 @max-movil/app:p-4">
      <h2 className="text-titulo">Átomos</h2>
      <div className={grid}>
        <Card title="Botón">
          <div className={row}>
            <Button>Crear cliente</Button>
            <Button variant="secondary">Pausar</Button>
            <Button variant="ghost">Cancelar</Button>
            <Button variant="destructive">Cancelar suscripción</Button>
          </div>
          <div className={row}>
            <Button disabled>Deshabilitado</Button>
            <Button busy>Guardando</Button>
            <Button variant="ghost" size="sm">
              Editar
            </Button>
          </div>
          <p className="text-tenue">
            Enlace: <Link href="#gallery">Ver suscripción</Link>
          </p>
        </Card>
        <Card title="Input, select y textarea">
          <Input aria-label="Vacío" placeholder="Buscar por nombre" />
          <Input
            aria-label="Con error"
            aria-invalid="true"
            defaultValue="marcela@"
          />
          <Input aria-label="Deshabilitado" defaultValue="130000" disabled />
          <NativeSelect aria-label="Producto">
            <option>Sitio web</option>
            <option>Tienda en línea</option>
          </NativeSelect>
          <Textarea aria-label="Descripción" placeholder="Descripción" />
          <Skeleton className="w-3/5" />
        </Card>
        <Card title="Insignia y nodo">
          <div className={row}>
            <Badge variant="active">Activa</Badge>
            <Badge variant="paused">Pausada</Badge>
            <Badge variant="cancelled">Cancelada</Badge>
          </div>
          <div className={row}>
            <Badge variant="paid">Pagada</Badge>
            <Badge variant="pending">Pendiente</Badge>
            <Badge variant="overdue">Vencida</Badge>
          </div>
          <div className={row}>
            <Badge variant="active">Activo</Badge>
            <Badge variant="inactive">Inactivo</Badge>
          </div>
          <p className="text-tenue">Cada estado cambia texto, forma y color.</p>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-pequeno">
            {(
              [
                ["paid", "Pagada"],
                ["pending", "Pendiente"],
                ["overdue", "Vencida"],
                ["none", "Sin mensualidad"],
              ] as const
            ).map(([s, label]) => (
              <span key={s} className="flex items-center gap-2">
                <Node status={s} large />
                {label}
              </span>
            ))}
          </div>
        </Card>
        <Card title="Aviso">
          <Alert>Registramos el pago.</Alert>
          <Alert variant="destructive">
            No pudimos guardar. Intenta de nuevo.
          </Alert>
        </Card>
      </div>

      <h2 className="mt-4 text-titulo">Moléculas</h2>
      <div className={grid}>
        <Card title="Campo de formulario">
          <FormField
            label="Cuenta receptora"
            help="Banco, tipo y últimos dígitos."
          >
            {(p) => <Input {...p} defaultValue="Nequi 0121" />}
          </FormField>
          <FormField label="Nombre o razón social" error="Escribe el nombre.">
            {(p) => <Input {...p} />}
          </FormField>
          <CheckboxField label="Activo" defaultChecked />
        </Card>
        <Card title="Buscador y filtros">
          <div className="flex items-center gap-2">
            <SearchBox
              label="Buscar cliente"
              placeholder="Nombre, contacto o correo"
              value={query}
              onChange={setQuery}
            />
            <FiltersButton applied={2} onClick={() => undefined} />
            <FiltersButton applied={0} onClick={() => undefined} />
          </div>
          <p className="text-tenue">
            {found.length ? found.join(" · ") : "Sin resultados"}
          </p>
          <FilterChips
            label="Estado"
            value={chip}
            onChange={setChip}
            options={[
              { value: "all", label: "Todas", count: 11 },
              { value: "active", label: "Activas", count: 9 },
              { value: "paused", label: "Pausadas", count: 1 },
            ]}
          />
        </Card>
        <Card title="Mensualidades que cubre">
          <CoverageList
            items={coverage}
            count={covered}
            onChange={setCovered}
          />
        </Card>
        <Card title="Recorrido y lista de datos">
          <Journey statuses={journey} />
          <DataList
            items={[
              { term: "Contacto", value: "Julián Prado" },
              { term: "Correo", value: "julian.prado@ejemplo.co" },
              {
                term: "Teléfono",
                value: <span className="num">301 555 0118</span>,
              },
            ]}
          />
        </Card>
        <Card title="Paginación">
          <PaginationFooter
            page={page}
            size={10}
            total={120}
            onPage={setPage}
            onSize={() => undefined}
          />
        </Card>
      </div>
    </div>
  );
}

function Organisms() {
  const [view, setView] = useState<"list" | "map">("list");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [filters, setFilters] = useState<Filters>({
    ...noFilters,
    status: "overdue",
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const rows = [...sampleRows]
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate))
    .filter((r) => !filters.status || r.status === filters.status);
  const map = toMapRows(sampleRows);
  const total = view === "list" ? rows.length : map.length;
  return (
    <div className="grid gap-5 p-6 @max-movil/app:p-4">
      <h2 className="text-titulo">Organismos de cobros</h2>
      <div className="grid gap-4">
        <h3 className="text-tarjeta">Totales: datos y carga</h3>
        <CollectionTotals totals={sampleTotals} />
        <CollectionTotals totals={[]} loading />
        <h3 className="text-tarjeta">
          Barra, tabla y pie (lista) o mapa; se puede cambiar de vista
        </h3>
        <section className="rounded-tarjeta bg-superficie">
          <CollectionsToolbar
            view={view}
            query={query}
            applied={filters.status ? 1 : 0}
            onView={(v) => {
              setView(v);
              setPage(1);
            }}
            onQuery={setQuery}
            onFilters={() => setFiltersOpen(true)}
          />
          {view === "list" ? (
            <CollectionsTable
              rows={paginate(rows, page, size)}
              clientHref={() => "#gallery"}
            />
          ) : (
            <CollectionsMap
              rows={paginate(map, page, size)}
              months={mapMonths()}
              onPay={() => setPayOpen(true)}
              onOpen={() => undefined}
            />
          )}
          <PaginationFooter
            page={page}
            size={size}
            total={total}
            onPage={setPage}
            onSize={(n) => {
              setSize(n);
              setPage(1);
            }}
          />
        </section>
        <h3 className="text-tarjeta">Tabla en carga (6 filas)</h3>
        <section className="rounded-tarjeta bg-superficie">
          <CollectionsTable loading rows={[]} clientHref={() => ""} />
        </section>
        <div className={grid}>
          <section className="rounded-tarjeta bg-superficie">
            <StatePanel
              kind="empty"
              title="Todavía no hay cobros"
              text={
                "Los cobros aparecen cuando una suscripción " +
                "genera su primera mensualidad."
              }
              action={<Button>Ir a suscripciones</Button>}
            />
          </section>
          <section className="rounded-tarjeta bg-superficie">
            <StatePanel
              kind="error"
              title="No pudimos cargar los cobros"
              text="Revisa tu conexión. No se perdió ningún dato."
              action={<Button variant="secondary">Reintentar</Button>}
            />
          </section>
        </div>
        <div className={row}>
          <Button variant="secondary" onClick={() => setFiltersOpen(true)}>
            Abrir «Filtrar cobros»
          </Button>
          <Button variant="secondary" onClick={() => setPayOpen(true)}>
            Abrir «Registrar pago manual»
          </Button>
        </div>
      </div>
      <FiltersModal
        open={filtersOpen}
        view={view}
        filters={filters}
        products={[{ value: "Sitio web", label: "Sitio web" }]}
        clients={[{ value: "c1", label: "Odontología Prado" }]}
        matches={rows.length}
        onChange={setFilters}
        onClose={() => setFiltersOpen(false)}
      />
      <PaymentModal
        open={payOpen}
        subscriptions={sampleDebtors}
        onSubmit={async () => undefined}
        onClose={() => setPayOpen(false)}
      />
    </div>
  );
}

function Theme({ name, width }: { name: "claro" | "oscuro"; width?: string }) {
  return (
    <div
      data-tema={name}
      className={cx(
        "@container/app overflow-hidden rounded-tarjeta border",
        "border-linea bg-fondo text-tinta",
        width,
      )}
    >
      <p className="px-6 pt-4 text-pequeno text-tenue">
        Modo {name}
        {width && " · móvil"}
      </p>
      <Showcase />
      <Organisms />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <main className="grid gap-6 p-6">
      <h1 className="text-titulo">Galería del sistema</h1>
      <Theme name="claro" />
      <Theme name="oscuro" />
      <Theme name="claro" width="max-w-sm" />
    </main>
  </StrictMode>,
);
