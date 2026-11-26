import { useEffect, useState, useSyncExternalStore } from "react";

const desktop = "(min-width: 861px)";
const headHeight = 36;
const rowHeight = 54;

const subscribe = (notify: () => void) => {
  const query = window.matchMedia(desktop);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};

// Filas que caben en el elemento. Mide la cabecera y la primera fila reales
// (con 36 y 54 px de respaldo). Cambia `key` al cambiar el tipo de filas.
// En móvil devuelve `undefined`: ahí la página crece y se elige el tamaño.
export function useFitRows(key?: unknown) {
  const isDesktop = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(desktop).matches,
  );
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [rows, setRows] = useState<number>();
  useEffect(() => {
    if (!node || !isDesktop) return setRows(undefined);
    const observer = new ResizeObserver(([entry]) => {
      // Quita el estirado anterior para medir la altura natural de la fila.
      node.style.removeProperty("--row-h");
      const head = node.querySelector("thead")?.getBoundingClientRect();
      const row = node.querySelector("tbody tr")?.getBoundingClientRect();
      const free = entry.contentRect.height - (head?.height ?? headHeight);
      const count = Math.max(1, Math.floor(free / (row?.height || rowHeight)));
      // Reparte la altura sobrante entre las filas (`--row-h`).
      node.style.setProperty("--row-h", `${free / count}px`);
      setRows(count);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, isDesktop, key]);
  return { ref: setNode, rows: isDesktop ? rows : undefined };
}
