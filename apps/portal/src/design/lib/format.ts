// Moneda COP: `$ 130.000`.
export const formatCop = (amount: number) =>
  `$ ${amount.toLocaleString("es-CO")}`;

// Búsqueda sin acentos ni mayúsculas.
export const normalizeText = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

const months = "ene feb mar abr may jun jul ago sep oct nov dic".split(" ");
const longMonths = (
  "Enero Febrero Marzo Abril Mayo Junio Julio Agosto Septiembre Octubre " +
  "Noviembre Diciembre"
).split(" ");

const parts = (iso: string) => iso.split("-").map(Number);

// `2026-11-05` -> `5 nov 2026`. Se lee como texto: sin zonas horarias.
export const formatDate = (iso: string) => {
  const [y, m, d] = parts(iso);
  return `${d} ${months[m - 1]} ${y}`;
};

// `2026-11-05` -> `Noviembre 2026`
export const formatMonth = (iso: string) => {
  const [y, m] = parts(iso);
  return `${longMonths[m - 1]} ${y}`;
};

// `2026-11-05` -> `nov`
export const shortMonth = (iso: string) => months[parts(iso)[1] - 1];

export const statusLabels = {
  paid: "Pagada",
  pending: "Pendiente",
  overdue: "Vencida",
  none: "Sin mensualidad",
} as const;
