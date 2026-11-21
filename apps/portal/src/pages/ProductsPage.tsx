import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import ProductForm, { type NewProduct } from "../organisms/ProductForm";
import ProductTable, { type Product } from "../organisms/ProductTable";
import ProductsTemplate from "../templates/ProductsTemplate";

export default function ProductsPage({ accessToken }: { accessToken: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");

  const api = useCallback(
    () =>
      axios.create({
        baseURL: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api`,
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${accessToken}`,
        },
      }),
    [accessToken],
  );

  useEffect(() => {
    api()
      .get<Product[]>("/products")
      .then(({ data }) => setProducts(data))
      .catch(() => setError("No pudimos cargar los productos."));
  }, [api]);

  async function createProduct(product: NewProduct) {
    try {
      const { data } = await api().post<Product>("/products", product);
      setProducts((current) =>
        [...current, data].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setError("");
    } catch {
      setError("No pudimos crear el producto.");
    }
  }

  return (
    <ProductsTemplate
      form={<ProductForm onSubmit={createProduct} error={error} />}
      table={<ProductTable products={products} />}
    />
  );
}
