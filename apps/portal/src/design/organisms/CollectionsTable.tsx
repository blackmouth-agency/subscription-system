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
                  <Link href={clientHref(r)}>{r.client}</Link>
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
          <li key={r.id} className="grid gap-2.5 rounded-control border p-4">
            {loading ? (
              <>
                <Skeleton className="w-40" />
                <Skeleton className="w-24" />
                <Skeleton className="w-20" />
              </>
            ) : (
              <>
                <div>
                  <Link href={clientHref(r)}>{r.client}</Link>
                  <small className="block text-minimo text-muted-foreground">
                    {r.product}
                  </small>
                </div>
                <dl
                  className={cx(
                    "grid grid-cols-[auto_1fr] items-center",
                    "gap-x-4 gap-y-2",
                  )}
                >
                  <dt className="text-muted-foreground">Vence</dt>
                  <dd className="text-right">
                    <Dates row={r} />
                  </dd>
                  <dt className="text-muted-foreground">Monto</dt>
                  <dd className="text-right">
                    <span className="num">{formatCop(r.amount)}</span>
                  </dd>
                  <dt className="text-muted-foreground">Estado</dt>
                  <dd className="justify-self-end">
                    <Badge variant={r.status}>{statusLabels[r.status]}</Badge>
                  </dd>
                </dl>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
