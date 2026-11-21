// Reglas comunes de React Hook Form para los formularios de administración.
export const trim = (value: string) => value.trim();

export const maxLength = (value: number) => ({
  value,
  message: `Máximo ${value} caracteres.`,
});
