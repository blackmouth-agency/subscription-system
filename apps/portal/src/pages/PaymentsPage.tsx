import { Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createApi } from "../api";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {
  appliedCount,
  currentMonthRange,
  noFilters,
} from "../design/lib/collections";
import { formatMonth } from "../design/lib/format";
import CollectionsMap, {
  type MapRow,
} from "../design/organisms/CollectionsMap";
import CollectionsTable from "../design/organisms/CollectionsTable";
import { useFitRows } from "../design/lib/useFitRows";
import CollectionsToolbar from "../design/organisms/CollectionsToolbar";
import CollectionTotals, {
  type Total,
} from "../design/organisms/CollectionTotals";
import FiltersModal from "../design/organisms/FiltersModal";
import PaginationFooter from "../design/organisms/PaginationFooter";
import PaymentModal, {
  type DebtorSubscription,
  type PaymentSubmit,
} from "../design/organisms/PaymentModal";
import StatePanel from "../design/organisms/StatePanel";
import CollectionsTemplate from "../design/templates/CollectionsTemplate";
import type { Collection, Filters, View } from "../design/types";

// La API filtra, ordena, pagina y suma; aquí solo se pide y se pinta.
type ListRow = {
  id: string;
  subscription_id: string;
  client_id: string;
  client_name: string;
  product_id: string;
  product_name: string;
  due_date: string;
  amount: number;
  status: Collection["status"];
  paid_at: string | null;
};

type MapApiRow = {
  subscription_id: string;
  client_id: string;
  client_name: string;
  product_name: string;
  months: MapRow["byMonth"] | null;
};

type Page<Row> = {
  any: boolean;
  total: number;
  totals: Total[];
  rows: Row[];
};

type Payable = {
  subscription_id: string;
  client_name: string;
  product_name: string;
  installments: {
    id: string;
    due_date: string;
    amount: number;
    status: "pending" | "overdue";
  }[];
};

const toCollection = (r: ListRow): Collection => ({
  id: r.id,
  subscriptionId: r.subscription_id,
  clientId: r.client_id,
  productId: r.product_id,
  client: r.client_name,
  product: r.product_name,
  dueDate: r.due_date,
  amount: r.amount,
  status: r.status,
  paidAt: r.paid_at,
});

const toMapRow = (r: MapApiRow): MapRow => ({
  subscriptionId: r.subscription_id,
  clientId: r.client_id,
  client: r.client_name,
  product: r.product_name,
  byMonth: r.months ?? {},
});

const toDebtor = (p: Payable): DebtorSubscription => ({
  id: p.subscription_id,
  label: `${p.client_name} · ${p.product_name}`,
  installments: p.installments.map((i) => ({
    id: i.id,
    label: formatMonth(i.due_date),
    status: i.status,
    amount: i.amount,
  })),
});

const subscriptionsHref = "/admin/subscriptions";
const searchDelay = 300;

type Body =
  | { kind: "list"; rows: Collection[] }
  | { kind: "map"; rows: MapRow[]; months: string[] };

type Loaded =
  | { state: "loading" }
  | { state: "error" }
  | {
      state: "ready";
      any: boolean;
      total: number;
      totals: Total[];
      body: Body;
    };

type Option = { id: string; name: string };

export default function PaymentsPage({ accessToken }: { accessToken: string }) {
  const api = useMemo(() => createApi(accessToken), [accessToken]);
  const [data, setData] = useState<Loaded>({ state: "loading" });
  const [version, setVersion] = useState(0);
  const [view, setView] = useState<View>("list");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>({
    ...noFilters,
    ...currentMonthRange(),
  });
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [payment, setPayment] = useState<{
    debtors: DebtorSubscription[];
    subscriptionId?: string;
    count: number;
  }>();
  const [notice, setNotice] = useState("");
  const [options, setOptions] = useState<{
    clients: Option[];
    products: Option[];
  }>({ clients: [], products: [] });

  useEffect(() => {
    api
      .get<typeof options>("/installments/options")
      .then(({ data }) => setOptions(data))
      .catch(() => {}); // sin opciones el filtro queda vacío; la lista sigue
  }, [api, version]);

  // La búsqueda espera a que se deje de escribir antes de pedir.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query), searchDelay);
    return () => clearTimeout(timer);
  }, [query]);

  // En escritorio las filas por página las dicta la altura disponible.
  const fit = useFitRows(view);
  const pageSize = fit.rows ?? size;

  useEffect(() => {
    const controller = new AbortController();
    const params = {
      client_id: filters.clientId || undefined,
      product_id: filters.productId || undefined,
      status: filters.status || undefined,
      q: search.trim() || undefined,
      // En el mapa no hay fechas: siempre los últimos 12 meses.
      from: view === "list" ? filters.from || undefined : undefined,
      to: view === "list" ? filters.to || undefined : undefined,
      page,
      size: pageSize,
    };
    api
      .get(view === "list" ? "/installments" : "/installments/map", {
        params,
        signal: controller.signal,
      })
      .then(({ data: d }) => {
        const body: Body =
          view === "list"
            ? {
                kind: "list",
                rows: (d as Page<ListRow>).rows.map(toCollection),
              }
            : {
                kind: "map",
                rows: (d as Page<MapApiRow>).rows.map(toMapRow),
                months: d.months,
              };
        // Una página que ya no existe (p. ej. tras filtrar) vuelve a la última.
        if (d.rows.length === 0 && d.total > 0) {
          return setPage(Math.ceil(d.total / pageSize));
        }
        setData({
          state: "ready",
          any: d.any,
          total: d.total,
          totals: d.totals,
          body,
        });
      })
      .catch((e) => {
        if (!controller.signal.aborted && e?.code !== "ERR_CANCELED") {
          setData({ state: "error" });
        }
      });
    return () => controller.abort();
  }, [api, view, filters, search, page, pageSize, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const retry = () => {
    setData({ state: "loading" });
    reload();
  };

  // Cada cambio de lo que se ve devuelve a la página 1.
  const reset =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      set(value);
      setPage(1);
    };

  // Las mensualidades por pagar se piden al abrir: siempre al día.
  async function openPayment(subscriptionId?: string, installmentId?: string) {
    try {
      const { data: rows } = await api.get<Payable[]>("/installments/payable");
      const debtors = rows.map(toDebtor);
      const index =
        debtors
          .find((d) => d.id === subscriptionId)
          ?.installments.findIndex((i) => i.id === installmentId) ?? 0;
      setPayment({ debtors, subscriptionId, count: Math.max(index, 0) + 1 });
    } catch {
      setNotice("No pudimos cargar las mensualidades por pagar.");
    }
  }

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
    reload();
  }

  const clearAll = () => {
    setFilters({ ...noFilters });
    setQuery("");
    setSearch("");
    setPage(1);
  };

  const detailHref = (row: { clientId: string }) =>
    `${subscriptionsHref}?client_id=${row.clientId}`;

  const ready = data.state === "ready" ? data : undefined;
  const applied = appliedCount(filters, view);
  const matches = ready ? ready.totals.reduce((n, t) => n + t.count, 0) : 0;
  const total = ready?.total ?? 0;
  const current = Math.min(page, Math.max(1, Math.ceil(total / pageSize)));

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
            <Button variant="secondary" onClick={retry}>
              Reintentar
            </Button>
          }
        />
      </div>
    );
  } else if (!data.any) {
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
    const { body } = data;
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
            {body.kind === "list" ? (
              <CollectionsTable rows={body.rows} clientHref={detailHref} />
            ) : (
              <CollectionsMap
                rows={body.rows}
                months={body.months}
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
        ready?.any ? (
          <Button onClick={() => openPayment()}>
            <Plus aria-hidden="true" strokeWidth={1.6} className="size-4.5" />
            Registrar pago
          </Button>
        ) : undefined
      }
      notice={notice ? <Alert>{notice}</Alert> : undefined}
      totals={
        data.state === "error" ? undefined : (
          <CollectionTotals
            totals={ready?.totals ?? []}
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
        products={options.products.map((p) => ({
          value: p.id,
          label: p.name,
        }))}
        clients={options.clients.map((c) => ({ value: c.id, label: c.name }))}
        matches={matches}
        onChange={reset(setFilters)}
        onClose={() => setFiltersOpen(false)}
      />
      <PaymentModal
        open={payment !== undefined}
        subscriptions={payment?.debtors ?? []}
        subscriptionId={payment?.subscriptionId}
        count={payment?.count}
        onSubmit={pay}
        onClose={() => setPayment(undefined)}
      />
    </CollectionsTemplate>
  );
}
