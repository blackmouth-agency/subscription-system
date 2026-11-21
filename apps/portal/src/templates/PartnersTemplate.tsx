import type { ReactNode } from "react";

export default function PartnersTemplate({
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
