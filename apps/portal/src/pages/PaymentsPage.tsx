import { Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createApi } from "../api";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {
  appliedCount,
  currentMonthRange,
  filterCollections,
  mapMonths,
  noFilters,
  paginate,
  summarize,
} from "../design/lib/collections";
import { formatMonth } from "../design/lib/format";
import CollectionsMap, {
  toMapRows,
  type MapRow,
} from "../design/organisms/CollectionsMap";
import CollectionsTable from "../design/organisms/CollectionsTable";
import { useFitRows } from "../design/lib/useFitRows";
import CollectionsToolbar from "../design/organisms/CollectionsToolbar";
import CollectionTotals from "../design/organisms/CollectionTotals";
import FiltersModal from "../design/organisms/FiltersModal";
import PaginationFooter from "../design/organisms/PaginationFooter";
import PaymentModal, {
  type DebtorSubscription,
  type PaymentSubmit,
} from "../design/organisms/PaymentModal";
import StatePanel from "../design/organisms/StatePanel";
import CollectionsTemplate from "../design/templates/CollectionsTemplate";
import type { Collection, Filters, View } from "../design/types";
import { useAdminResource } from "../hooks/useAdminResource";
import type { Client } from "../organisms/ClientTable";
import type { Product } from "../organisms/ProductTable";

type ApiRow = {
  id: string;
  subscription_id: string;
  client_id: string;
  client_name: string;
  product_id: string;
  product_name: string;
  due_date: string;
  amount: number;
  display_status: string;
  paid_at: string | null;
};

// `to_activate` también se paga (la RPC lo cubre) y se muestra como
// pendiente; `voided` no es un cobro y no se lista.
const statusOf = (s: string) =>
  ({
    paid: "paid",
    overdue: "overdue",
    pending: "pending",
    to_activate: "pending",
  })[s] as Collection["status"] | undefined;

const toCollection = (r: ApiRow): Collection => ({
  id: r.id,
  subscriptionId: r.subscription_id,
  clientId: r.client_id,
  productId: r.product_id,
  client: r.client_name,
  product: r.product_name,
  dueDate: r.due_date,
  amount: r.amount,
  status: statusOf(r.display_status)!,
  paidAt: r.paid_at,
});

const messages = { loadError: "", saveError: "" };
const subscriptionsHref = "/admin/subscriptions";

type Loaded =
  | { state: "loading" }
  | { state: "error" }
  | { state: "ready"; rows: Collection[] };

export default function PaymentsPage({ accessToken }: { accessToken: string }) {
  const api = useMemo(() => createApi(accessToken), [accessToken]);
  const [data, setData] = useState<Loaded>({ state: "loading" });
  const [view, setView] = useState<View>("list");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({
    ...noFilters,
    ...currentMonthRange(),
  });
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [payment, setPayment] = useState<{
    subscriptionId?: string;
    count: number;
  }>();
  const [notice, setNotice] = useState("");
  const { rows: clients } = useAdminResource<Client, never>(
    "/clients",
    accessToken,
    messages,
  );
  const { rows: products } = useAdminResource<Product, never>(
    "/products",
    accessToken,
    messages,
  );

  const load = useCallback(() => {
    setData({ state: "loading" });
    api
      .get<{ rows: ApiRow[] }>("/installments")
      .then(({ data }) =>
        setData({
          state: "ready",
          rows: data.rows
            .filter((r) => statusOf(r.display_status))
            .map(toCollection),
        }),
      )
      .catch(() => setData({ state: "error" }));
  }, [api]);
  useEffect(load, [load]);

  const all = useMemo(() => (data.state === "ready" ? data.rows : []), [data]);
  const found = useMemo(
    () => filterCollections(all, filters, query, view),
    [all, filters, query, view],
  );
  const totals = useMemo(() => summarize(found), [found]);
  const applied = appliedCount(filters, view);

  // Cada cambio de lo que se ve devuelve a la página 1.
  const reset =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      set(value);
      setPage(1);
    };

  const sorted = useMemo(
    () => [...found].sort((a, b) => b.dueDate.localeCompare(a.dueDate)),
    [found],
  );
  const mapRows = useMemo(() => toMapRows(found), [found]);
  const total = view === "list" ? sorted.length : mapRows.length;
  // En escritorio las filas por página las dicta la altura disponible.
  const fit = useFitRows(view);
  const pageSize = fit.rows ?? size;
  const current = Math.min(page, Math.max(1, Math.ceil(total / pageSize)));

  // Suscripciones con deuda, con sus mensualidades de la más antigua a la
  // más nueva (es el orden en que la RPC las cubre).
  const debtors = useMemo(() => {
    const by = new Map<string, DebtorSubscription>();
    for (const r of [...all].sort((a, b) =>
      a.dueDate.localeCompare(b.dueDate),
    )) {
      if (r.status === "paid") continue;
      const s = by.get(r.subscriptionId) ?? {
        id: r.subscriptionId,
        label: `${r.client} · ${r.product}`,
        installments: [],
      };
      s.installments.push({
        id: r.id,
        label: formatMonth(r.dueDate),
        status: r.status,
        amount: r.amount,
      });
      by.set(r.subscriptionId, s);
    }
    return [...by.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [all]);

  const openPayment = (row: Collection) => {
    const debt = debtors.find((d) => d.id === row.subscriptionId);
    const index = debt?.installments.findIndex((i) => i.id === row.id) ?? 0;
    setPayment({ subscriptionId: row.subscriptionId, count: index + 1 });
  };

  async function pay(p: PaymentSubmit) {
    try {
      await api.post(
        `/subscriptions/${p.subscriptionId}/payments`,
        {
          amount: p.amount,
          paid_at: p.paidAt,
          method: p.method,
          reference: p.reference,
        },
        { headers: { "Idempotency-Key": p.idempotencyKey } },
      );
    } catch {
      return "No pudimos guardar. Intenta de nuevo.";
    }
    setPayment(undefined);
    setNotice("Registramos el pago.");
    load();
  }

  const clearAll = () => {
    setFilters({ ...noFilters });
    setQuery("");
    setPage(1);
  };

  const detailHref = (row: { clientId: string }) =>
    `${subscriptionsHref}?client_id=${row.clientId}`;

  let card;
  if (data.state === "loading") {
    card = <CollectionsTable loading rows={[]} clientHref={() => ""} />;
  } else if (data.state === "error") {
    card = (
      <div className="flex flex-1 items-center justify-center">
        <StatePanel
          kind="error"
          title="No pudimos cargar los cobros"
          text="Revisa tu conexión. No se perdió ningún dato."
          action={
            <Button variant="secondary" onClick={load}>
              Reintentar
            </Button>
          }
        />
      </div>
    );
  } else if (all.length === 0) {
    card = (
      <StatePanel
        kind="empty"
        title="Todavía no hay cobros"
        text={
          "Los cobros aparecen cuando una suscripción " +
          "genera su primera mensualidad."
        }
        action={
          <Button onClick={() => window.location.assign(subscriptionsHref)}>
            Ir a suscripciones
          </Button>
        }
      />
    );
  } else {
    card = (
      <>
        <CollectionsToolbar
          view={view}
          query={query}
          applied={applied}
          onView={reset(setView)}
          onQuery={reset(setQuery)}
          onFilters={() => setFiltersOpen(true)}
        />
        {total === 0 ? (
          <StatePanel
            kind="empty"
            title="Sin cobros con estos filtros"
            text="Prueba con otra búsqueda o quita los filtros."
            action={
              <Button variant="secondary" onClick={clearAll}>
                Quitar filtros
              </Button>
            }
          />
        ) : (
          <div
            ref={fit.ref}
            className="min-h-0 flex-1 min-[861px]:overflow-hidden"
          >
            {view === "list" ? (
              <CollectionsTable
                rows={paginate(sorted, current, pageSize)}
                clientHref={detailHref}
              />
            ) : (
              <CollectionsMap
                rows={paginate(mapRows, current, pageSize)}
                months={mapMonths()}
                onPay={openPayment}
                onOpen={(row: MapRow) =>
                  window.location.assign(detailHref(row))
                }
              />
            )}
          </div>
        )}
        {total > 0 && (
          <PaginationFooter
            page={current}
            size={pageSize}
            total={total}
            note={
              view === "list"
                ? "El registro no es constancia de transferencia."
                : undefined
            }
            onPage={setPage}
            onSize={fit.rows ? undefined : reset(setSize)}
          />
        )}
      </>
    );
  }

  return (
    <CollectionsTemplate
      action={
        data.state === "ready" && all.length > 0 ? (
          <Button onClick={() => setPayment({ count: 1 })}>
            <Plus aria-hidden="true" strokeWidth={1.6} className="size-4.5" />
            Registrar pago
          </Button>
        ) : undefined
      }
      notice={notice ? <Alert>{notice}</Alert> : undefined}
      totals={
        data.state === "error" ? undefined : (
          <CollectionTotals
            totals={totals}
            loading={data.state === "loading"}
          />
        )
      }
    >
      {card}
      <FiltersModal
        open={filtersOpen}
        view={view}
        filters={filters}
        products={products.map((p) => ({ value: p.id, label: p.name }))}
        clients={clients.map((c) => ({ value: c.id, label: c.name }))}
        matches={found.length}
        onChange={reset(setFilters)}
        onClose={() => setFiltersOpen(false)}
      />
      <PaymentModal
        open={payment !== undefined}
        subscriptions={debtors}
        subscriptionId={payment?.subscriptionId}
        count={payment?.count}
        onSubmit={pay}
        onClose={() => setPayment(undefined)}
      />
    </CollectionsTemplate>
  );
}
