import DataTable from "../molecules/DataTable";
import { cop } from "../subscriptionLabels";

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
};

export default function ProductTable({ products }: { products: Product[] }) {
  return (
    <DataTable
      caption="Productos"
      rows={products}
      columns={[
        { header: "Nombre", cell: (p) => p.name },
        { header: "Descripción", cell: (p) => p.description },
        { header: "Precio", cell: (p) => cop.format(p.price) },
      ]}
    />
  );
}
