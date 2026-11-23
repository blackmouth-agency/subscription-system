import type { ComponentProps } from "react";

export type Option = { value: string; label: string };

type Props = {
  id: string;
  label: string;
  options: Option[];
  // Opción vacía inicial (value ""), p. ej. "Elige un cliente" o "Todos".
  placeholder?: string;
  error?: string;
} & ComponentProps<"select">;

// label + select + mensaje de error. Recibe el `register(...)` de React Hook
// Form esparcido en las props.
export default function SelectField({
  id,
  label,
  options,
  placeholder,
  error,
  ...props
}: Props) {
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <select id={id} {...props}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span role="alert">{error}</span>
    </>
  );
}
