import type { ReactNode } from "react";

export type Column<T> = { header: string; cell: (row: T) => ReactNode };

// Tabla de filas con `id`. Con `empty`, una lista vacía muestra ese texto.
export default function DataTable<T extends { id: string }>({
  caption,
  columns,
  rows,
  empty,
}: {
  caption?: string;
  columns: Column<T>[];
  rows: T[];
  empty?: string;
}) {
  if (empty && rows.length === 0) return <p className="vacio">{empty}</p>;
  return (
    <div className="tabla-marco">
      <table className="tabla">
        {caption && <caption>{caption}</caption>}
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.header} scope="col">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((c) => (
                <td key={c.header}>{c.cell(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
