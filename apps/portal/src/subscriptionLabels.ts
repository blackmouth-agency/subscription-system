export const cop = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export const statuses: Record<string, string> = {
  pending: "Pendiente",
  active: "Activa",
  suspended: "Suspendida",
  cancelled: "Cancelada",
};

export const installmentStatuses: Record<string, string> = {
  to_activate: "Por activar",
  pending: "Pendiente",
  overdue: "Vencida",
  paid: "Pagada",
  voided: "Anulada",
};

export const receivers: Record<string, string> = {
  agency: "Agencia",
  partner: "Socio",
};

export const paymentMethods: Record<string, string> = {
  transfer: "Transferencia",
  cash: "Efectivo",
  other: "Otro",
};
