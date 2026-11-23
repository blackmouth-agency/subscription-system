import { useEffect, useMemo, useState } from "react";
import { createApi } from "../api";
import { useAdminResource } from "../hooks/useAdminResource";
import type { Client } from "../organisms/ClientTable";
import InstallmentFilters, {
  type Filters,
} from "../organisms/InstallmentFilters";
import PaymentsTable, {
  type Collection,
  type Totals,
} from "../organisms/PaymentsTable";
import type { Product } from "../organisms/ProductTable";
import FormTableTemplate from "../templates/FormTableTemplate";

const noTotals: Totals = { collected: 0, commission: 0, agency: 0 };

export default function PaymentsPage({ accessToken }: { accessToken: string }) {
  const api = useMemo(() => createApi(accessToken), [accessToken]);
  const [filters, setFilters] = useState<Partial<Filters>>({});
  const [data, setData] = useState({
    rows: [] as Collection[],
    totals: noTotals,
  });
  const [error, setError] = useState("");
  const { rows: clients } = useAdminResource<Client, never>(
    "/clients",
    accessToken,
    { loadError: "", saveError: "" },
  );
  const { rows: products } = useAdminResource<Product, never>(
    "/products",
    accessToken,
    { loadError: "", saveError: "" },
  );

  useEffect(() => {
    // Los filtros vacíos no viajan.
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v),
    );
    api
      .get<typeof data>("/installments", { params })
      .then((res) => {
        setData(res.data);
        setError("");
      })
      .catch(() => setError("No pudimos cargar los cobros."));
  }, [api, filters]);

  return (
    <FormTableTemplate
      form={
        <InstallmentFilters
          clients={clients}
          products={products}
          onChange={setFilters}
        />
      }
      table={
        <>
          {error && <p role="alert">{error}</p>}
          <PaymentsTable rows={data.rows} totals={data.totals} />
        </>
      }
    />
  );
}
