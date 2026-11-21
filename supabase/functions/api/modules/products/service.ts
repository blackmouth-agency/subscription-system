import { crudService } from "../../shared/crud.ts";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  is_active: boolean;
  created_at: string;
};

// Sin editar todavía: no hay `update` ni `notFound` que usar.
export const service = crudService<Product>({
  table: "products",
  notFound: "Producto no encontrado",
});
