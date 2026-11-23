const graceDays = 3; // shortcut: fijos, por suscripción llega después.
const dayMs = 86_400_000;

export const bogotaToday = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });

// `vencida` no se guarda: pending con due_date + gracia < hoy (Bogotá).
export function displayStatus(
  { status, due_date }: { status: string; due_date: string },
  cancelled: boolean,
  today: string,
) {
  if (status === "paid") return status;
  if (cancelled) return "voided";
  if (status === "pending") {
    const limit = Date.parse(due_date) + graceDays * dayMs;
    return limit < Date.parse(today) ? "overdue" : "pending";
  }
  return status;
}
