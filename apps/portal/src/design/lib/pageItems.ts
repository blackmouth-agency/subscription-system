// 1 … p-1 p p+1 … n; `null` = puntos suspensivos.
export function pageItems(page: number, count: number) {
  const pages = new Set(
    [1, page - 1, page, page + 1, count].filter((p) => p >= 1 && p <= count),
  );
  const items: (number | null)[] = [];
  let last = 0;
  for (const p of [...pages].sort((a, b) => a - b)) {
    if (p - last === 2) items.push(last + 1);
    else if (p - last > 2) items.push(null);
    items.push(p);
    last = p;
  }
  return items;
}
