import { crudService } from "../../shared/crud.ts";

type Subscription = {
  id: string;
  client_id: string;
  product_id: string;
  price: number;
  commission: number;
  receiver: string;
  cycle_date: string;
  status: string;
  client: { name: string };
  product: { name: string };
};

// Sin editar todavía (historias 6 y 7): no hay `update`.
export const service = crudService<Subscription>({
  table: "subscriptions",
  notFound: "Suscripción no encontrada",
  select: "*, client:clients(name), product:products(name)",
  order: ["created_at", false],
  filters: ["client_id"],
  fkNotFound: {
    subscriptions_client_id_fkey: "Cliente no encontrado",
    subscriptions_product_id_fkey: "Producto no encontrado",
  },
});
