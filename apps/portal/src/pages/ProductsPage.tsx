import { useAdminResource } from "../hooks/useAdminResource";
import ProductForm, { type NewProduct } from "../organisms/ProductForm";
import ProductTable, { type Product } from "../organisms/ProductTable";
import FormTableTemplate from "../templates/FormTableTemplate";

export default function ProductsPage({ accessToken }: { accessToken: string }) {
  const { rows, save, error } = useAdminResource<Product, NewProduct>(
    "/products",
    accessToken,
    {
      loadError: "No pudimos cargar los productos.",
      saveError: "No pudimos crear el producto.",
    },
  );

  return (
    <FormTableTemplate
      form={<ProductForm onSubmit={save} error={error} />}
      table={<ProductTable products={rows} />}
    />
  );
}
