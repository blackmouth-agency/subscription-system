import type { ReactNode } from "react";

export default function ProductsTemplate({
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
