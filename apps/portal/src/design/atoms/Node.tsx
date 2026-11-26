import type { InstallmentStatus } from "../types";

const box = "rounded-nodo border-medio";
const styles: Record<InstallmentStatus, string> = {
  paid: `${box} border-transparent bg-hecho`,
  pending: `${box} border-azul bg-superficie`,
  overdue: `${box} border-transparent bg-oxido`,
  none: "m-0.75 size-1 bg-borde",
};

// Una mensualidad. Decorativo: el texto o el `aria-label` del contenedor
// lleva el estado.
export default function Node({
  status,
  large,
}: {
  status: InstallmentStatus;
  large?: boolean;
}) {
  const size = status === "none" ? "" : large ? "size-3.5" : "size-2.5";
  return (
    <i
      aria-hidden="true"
      className={`relative flex-none ${size} ${styles[status]}`}
    />
  );
}
