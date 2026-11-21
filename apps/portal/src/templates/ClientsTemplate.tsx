import type { ReactNode } from "react";

export default function ClientsTemplate({
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
