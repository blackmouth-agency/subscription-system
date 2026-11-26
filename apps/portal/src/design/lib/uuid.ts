// `crypto.randomUUID` no existe en http que no sea localhost (ej. probar desde
// el celular por IP); `getRandomValues` sí.
export function uuid(): string {
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  const g = [0, 8, 12, 16, 20, 32];
  return g
    .slice(1)
    .map((e, i) => h.slice(g[i], e))
    .join("-");
}
