import { useForm } from "react-hook-form";
import { toOptions } from "../forms";
import SelectField from "../molecules/SelectField";
import { installmentStatuses } from "../subscriptionLabels";
import type { Client } from "./ClientTable";
import type { Product } from "./ProductTable";

export type Filters = {
  client_id: string;
  product_id: string;
  from: string;
  to: string;
  status: string;
};

const statusOptions = Object.entries(installmentStatuses).map(
  ([value, label]) => ({ value, label }),
);

export default function InstallmentFilters({
  clients,
  products,
  onChange,
}: {
  clients: Client[];
  products: Product[];
  onChange: (filters: Filters) => void;
}) {
  const { register, getValues } = useForm<Filters>({
    defaultValues: {
      client_id: "",
      product_id: "",
      from: "",
      to: "",
      status: "",
    },
  });

  return (
    <form onChange={() => onChange(getValues())}>
      <h2>Filtros</h2>
      <SelectField
        id="filter-client"
        label="Cliente"
        placeholder="Todos"
        options={toOptions(clients)}
        {...register("client_id")}
      />
      <SelectField
        id="filter-product"
        label="Producto"
        placeholder="Todos"
        options={toOptions(products)}
        {...register("product_id")}
      />
      <label htmlFor="filter-from">Desde</label>
      <input id="filter-from" type="date" {...register("from")} />
      <label htmlFor="filter-to">Hasta</label>
      <input id="filter-to" type="date" {...register("to")} />
      <SelectField
        id="filter-status"
        label="Estado"
        placeholder="Todos"
        options={statusOptions}
        {...register("status")}
      />
    </form>
  );
}
