import type { ReactNode } from "react";

export default function FormTableTemplate({
  form,
  table,
}: {
  form: ReactNode;
  table: ReactNode;
}) {
  return (
    <>
      {form}
      {table}
    </>
  );
}
