import DataTable from "../molecules/DataTable";
import { cop, installmentStatuses } from "../subscriptionLabels";

export type Installment = {
  id: string;
  due_date: string;
  amount: number;
  display_status: string;
};

export default function InstallmentTable({
  installments,
  onClose,
}: {
  installments: Installment[];
  onClose: () => void;
}) {
  return (
    <section>
      <h2>Mensualidades</h2>
      <button type="button" onClick={onClose}>
        Cerrar mensualidades
      </button>
      <DataTable
        empty="Sin mensualidades"
        rows={installments}
        columns={[
          { header: "Periodo", cell: (i) => i.due_date },
          { header: "Monto", cell: (i) => cop.format(i.amount) },
          {
            header: "Estado",
            cell: (i) => installmentStatuses[i.display_status],
          },
        ]}
      />
    </section>
  );
}
