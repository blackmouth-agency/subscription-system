import { useId } from "react";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Pagination,
  PaginationButton,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cx } from "../lib/cx";
import { pageItems } from "../lib/pageItems";

const pageSizes = [10, 25, 50];

// «Mostrando 1–10 de 24» · Filas por página · navegación. Siempre visible.
export default function PaginationFooter({
  page,
  size,
  total,
  note,
  onPage,
  onSize,
}: {
  page: number;
  size: number;
  total: number;
  note?: string;
  onPage: (page: number) => void;
  // Sin `onSize` no se ofrece elegir filas (escritorio: las dicta la altura).
  onSize?: (size: number) => void;
}) {
  const id = useId();
  const count = Math.max(1, Math.ceil(total / size));
  const from = total ? (page - 1) * size + 1 : 0;
  const to = Math.min(page * size, total);
  return (
    <footer className="grid gap-3 border-t px-5 py-3 text-muted-foreground">
      {note && <p className="text-pequeno">{note}</p>}
      <div
        className={cx(
          "flex flex-wrap items-center justify-between",
          "gap-x-4 gap-y-2 movil:flex-nowrap",
        )}
      >
        <span className="num whitespace-nowrap">
          Mostrando {from}–{to} de {total}
        </span>
        {onSize && (
          <div className="flex items-center gap-2 movil:hidden">
            <label htmlFor={id}>Filas por página</label>
            <NativeSelect
              id={id}
              value={size}
              onChange={(e) => onSize(Number(e.target.value))}
              className="num w-auto min-w-18"
            >
              {pageSizes.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </NativeSelect>
          </div>
        )}
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                disabled={page <= 1}
                onClick={() => onPage(page - 1)}
              />
            </PaginationItem>
            {pageItems(page, count).map((p, i) =>
              p === null ? (
                <PaginationItem key={`gap${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationButton
                    aria-label={`Página ${p}`}
                    isActive={p === page}
                    onClick={() => onPage(p)}
                  >
                    {p}
                  </PaginationButton>
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              <PaginationNext
                disabled={page >= count}
                onClick={() => onPage(page + 1)}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </footer>
  );
}
