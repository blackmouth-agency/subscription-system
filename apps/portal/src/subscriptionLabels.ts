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

export const receivers: Record<string, string> = {
  agency: "Agencia",
  partner: "Socio",
};
