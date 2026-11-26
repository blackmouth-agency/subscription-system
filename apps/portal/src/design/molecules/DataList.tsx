import type { ReactNode } from "react";

export default function DataList({
  items,
}: {
  items: { term: string; value: ReactNode }[];
}) {
  return (
    <dl className="grid gap-2.75">
      {items.map((item) => (
        <div key={item.term} className="flex justify-between gap-5">
          <dt className="flex-none text-tenue">{item.term}</dt>
          <dd className="min-w-0 text-right wrap-anywhere">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
