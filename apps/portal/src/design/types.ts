// Estados de DATOS.md. La interfaz muestra los textos en español.
export type InstallmentStatus = "paid" | "pending" | "overdue" | "none";

export type BadgeStatus =
  | "active"
  | "paused"
  | "cancelled"
  | "paid"
  | "pending"
  | "overdue"
  | "inactive";

// Una mensualidad en el listado de cobros. `none` solo existe en el mapa.
export type CollectionStatus = Exclude<InstallmentStatus, "none">;

export type Collection = {
  id: string;
  subscriptionId: string;
  clientId: string;
  productId: string;
  client: string;
  product: string;
  // YYYY-MM-DD
  dueDate: string;
  amount: number;
  status: CollectionStatus;
  paidAt: string | null;
};

export type Filters = {
  status: "" | CollectionStatus;
  productId: string;
  clientId: string;
  from: string;
  to: string;
};

export type View = "list" | "map";
