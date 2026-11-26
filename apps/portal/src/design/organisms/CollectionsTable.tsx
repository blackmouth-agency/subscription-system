import { CircleCheck, Clock, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "../atoms/Link";
import { cx } from "../lib/cx";
import { formatCop, formatDate, statusLabels } from "../lib/format";
import type { Collection } from "../types";

// Franja de estado de la tarjeta móvil: el color solo acompaña icono y texto.
const strip = {
  paid: [
    CircleCheck,
    "[--v:light-dark(#15803d,#4ade80)] text-(--v)",
    "bg-[color-mix(in_srgb,var(--v)_14%,var(--superficie))]",
  ],
  pending: [Clock, "bg-azul-tinte text-azul", ""],
  overdue: [TriangleAlert, "bg-oxido-tinte text-oxido", ""],
} as const;

function Strip({ row }: { row: Collection }) {
  const [Icon, color, tint] = strip[row.status];
  return (
    <p
      className={cx(
        "m-0 flex items-center gap-2 px-4 py-2.5 text-sm font-medium",
        color,
        tint,
      )}
    >
      <Icon aria-hidden="true" strokeWidth={1.8} className="size-4 flex-none" />
      {row.status === "paid" && row.paidAt
        ? `Pagada el ${formatDate(row.paidAt)}`
        : statusLabels[row.status]}
    </p>
  );
}

function Dates({ row }: { row: Collection }) {
  return (
    <>
      <span className="num">{formatDate(row.dueDate)}</span>
      {row.paidAt && (
        <small className="block text-minimo text-muted-foreground">
          pagada <span className="num">{formatDate(row.paidAt)}</span>
        </small>
      )}
    </>
  );
}

// Tabla de cobros. En un contenedor de 600 px o menos cada fila es una
// tarjeta con su etiqueta por dato. `loading` dibuja 6 filas de huesos.
export default function CollectionsTable({
  rows,
  loading,
  clientHref,
}: {
  rows: Collection[];
  loading?: boolean;
  clientHref: (row: Collection) => string;
}) {
  const items = loading
    ? Array.from({ length: 6 }, (_, i) => ({ id: `s${i}` }) as Collection)
    : rows;
  return (
    <div className="@container/tabla" aria-busy={loading || undefined}>
      <Table className="@max-tarjetas/tabla:hidden">
        <TableCaption>Cobros por vencimiento</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Cliente</TableHead>
            <TableHead scope="col">Vence</TableHead>
            <TableHead scope="col">Monto</TableHead>
            <TableHead scope="col">Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="[&_tr]:h-(--row-h)">
          {items.map((r) =>
            loading ? (
              <TableRow key={r.id}>
                <TableCell>
                  <Skeleton className="w-40" />
                </TableCell>
                <TableCell>
                  <Skeleton className="w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="w-20" />
                </TableCell>
              </TableRow>
            ) : (
              <TableRow key={r.id}>
                <TableCell>
                  <Link href={clientHref(r)} className="no-underline!">
                    {r.client}
                  </Link>
                  <small className="block text-minimo text-muted-foreground">
                    {r.product}
                  </small>
                </TableCell>
                <TableCell>
                  <Dates row={r} />
                </TableCell>
                <TableCell>
                  <span className="num">{formatCop(r.amount)}</span>
                </TableCell>
                <TableCell>
                  <Badge variant={r.status}>{statusLabels[r.status]}</Badge>
                </TableCell>
              </TableRow>
            ),
          )}
        </TableBody>
      </Table>

      <ul className="m-0 hidden list-none gap-3 p-3 @max-tarjetas/tabla:grid">
        {items.map((r) => (
          <li
            key={r.id}
            className="grid overflow-hidden rounded-tarjeta border"
          >
            {loading ? (
              <div className="grid gap-2.5 p-4">
                <Skeleton className="w-40" />
                <Skeleton className="w-24" />
                <Skeleton className="w-20" />
              </div>
            ) : (
              <>
                <Strip row={r} />
                <div className="grid gap-4 p-4">
                  <div>
                    <Link
                      href={clientHref(r)}
                      className="font-semibold no-underline!"
                    >
                      {r.client}
                    </Link>
                    <small className="block text-minimo text-muted-foreground">
                      {r.product}
                    </small>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="num text-2xl font-semibold">
                      {formatCop(r.amount)}
                    </span>
                    <small className="text-minimo text-muted-foreground">
                      {r.status === "pending" ? "Vence" : "Vencía"}{" "}
                      <span className="num">{formatDate(r.dueDate)}</span>
                    </small>
                  </div>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
