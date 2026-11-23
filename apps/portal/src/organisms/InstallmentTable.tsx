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
      {installments.length === 0 ? (
        <p>Sin mensualidades</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th scope="col">Periodo</th>
              <th scope="col">Monto</th>
              <th scope="col">Estado</th>
            </tr>
          </thead>
          <tbody>
            {installments.map((i) => (
              <tr key={i.id}>
                <td>{i.due_date}</td>
                <td>{cop.format(i.amount)}</td>
                <td>{installmentStatuses[i.display_status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
