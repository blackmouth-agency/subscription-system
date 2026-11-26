import type { ReactNode } from "react";

const grid = "M0 24H240M0 72H240M24 0V96M72 0V96M120 0V96M168 0V96M216 0V96";
const hollow = "fill-superficie stroke-borde stroke-[1.5]";
const way = "fill-none stroke-borde stroke-[1.5]";

// Estado vacío (mira azul sobre el nodo que falta) o de error (vía rota en
// óxido). Una sola acción.
export default function StatePanel({
  kind,
  title,
  text,
  action,
}: {
  kind: "empty" | "error";
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div
      role={kind === "error" ? "alert" : undefined}
      className="grid justify-items-center gap-1.5 px-6 pt-11 pb-13 text-center"
    >
      <svg
        viewBox="0 0 240 96"
        aria-hidden="true"
        className="mb-3.5 h-24 w-60 max-w-full"
      >
        <path d={grid} className="fill-none stroke-linea" />
        {kind === "empty" ? (
          <>
            <polyline points="24,72 72,72 120,24 168,24" className={way} />
            <rect
              x="18"
              y="66"
              width="12"
              height="12"
              rx="2"
              className={hollow}
            />
            <rect
              x="66"
              y="66"
              width="12"
              height="12"
              rx="2"
              className={hollow}
            />
            <rect
              x="114"
              y="18"
              width="12"
              height="12"
              rx="2"
              className={hollow}
            />
            <path
              d="M168 10v28M154 24h28"
              className="fill-none stroke-azul stroke-[1.5]"
            />
          </>
        ) : (
          <>
            <polyline points="24,72 72,72 120,24" className={way} />
            <polyline
              points="120,24 168,72"
              className="fill-none stroke-oxido stroke-[1.5]
                [stroke-dasharray:3_4]"
            />
            <rect
              x="18"
              y="66"
              width="12"
              height="12"
              rx="2"
              className="fill-hecho"
            />
            <rect
              x="66"
              y="66"
              width="12"
              height="12"
              rx="2"
              className="fill-hecho"
            />
            <rect
              x="114"
              y="18"
              width="12"
              height="12"
              rx="2"
              className="fill-hecho"
            />
            <rect
              x="162"
              y="66"
              width="12"
              height="12"
              rx="2"
              className="fill-oxido"
            />
          </>
        )}
      </svg>
      <h2 className="text-panel">{title}</h2>
      <p className="max-w-[44ch] text-tenue">{text}</p>
      {action && <div className="mt-3.5">{action}</div>}
    </div>
  );
}
