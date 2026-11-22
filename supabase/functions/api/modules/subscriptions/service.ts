import { crudService } from "../../shared/crud.ts";

type Subscription = {
  id: string;
  client_id: string;
  product_id: string;
  price: number;
  commission: number;
  commission_type: string;
  commission_months: number | null;
  partner_id: string | null;
  receiver: string;
  cycle_date: string;
  status: string;
  client: { name: string };
  partner: { name: string } | null;
  product: { name: string };
};

export const service = crudService<Subscription>({
  table: "subscriptions",
  notFound: "Suscripción no encontrada",
  select: "*, client:clients(name), product:products(name), partner:partners(name)",
  order: ["created_at", false],
  filters: ["client_id"],
  fkNotFound: {
    subscriptions_client_id_fkey: "Cliente no encontrado",
    subscriptions_product_id_fkey: "Producto no encontrado",
    subscriptions_partner_id_fkey: "Socio no encontrado",
  },
});
