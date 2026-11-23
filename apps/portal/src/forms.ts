// Reglas comunes de React Hook Form para los formularios de administración.
export const trim = (value: string) => value.trim();

export const maxLength = (value: number) => ({
  value,
  message: `Máximo ${value} caracteres.`,
});

// Texto opcional recortado, con largo máximo.
export const text = (max: number) => ({
  setValueAs: trim,
  maxLength: maxLength(max),
});

export const requiredName = {
  ...text(100),
  required: "Escribe el nombre.",
};

// Campo numérico entero > 0; `message` es el error que ve el usuario.
export const positiveInt = (message: string) => ({
  valueAsNumber: true,
  validate: (n: number | null | undefined) =>
    (Number.isInteger(n) && (n ?? 0) > 0) || message,
});

// `toLocaleDateString("sv")` da YYYY-MM-DD en hora local.
export const today = () => new Date().toLocaleDateString("sv");

// Filas con `id` y `name` -> opciones de un `select`.
export const toOptions = (rows: { id: string; name: string }[]) =>
  rows.map(({ id, name }) => ({ value: id, label: name }));
