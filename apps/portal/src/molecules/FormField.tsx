import type { ComponentProps } from "react";

type Props = {
  id: string;
  label: string;
  error?: string;
  multiline?: boolean;
} & ComponentProps<"input">;

// label + input (o textarea) + mensaje de error. Recibe el `register(...)` de
// React Hook Form esparcido en las props.
export default function FormField({
  id,
  label,
  error,
  multiline,
  ...props
}: Props) {
  return (
    <>
      <label htmlFor={id}>{label}</label>
      {multiline ? (
        <textarea id={id} {...(props as ComponentProps<"textarea">)} />
      ) : (
        <input id={id} {...props} />
      )}
      <span role="alert">{error}</span>
    </>
  );
}
