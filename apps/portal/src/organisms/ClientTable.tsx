import DataTable from "../molecules/DataTable";

export type Client = {
  id: string;
  name: string;
  contact_name: string;
  email: string;
  phone: string;
};

export default function ClientTable({
  clients,
  onEdit,
}: {
  clients: Client[];
  onEdit: (client: Client) => void;
}) {
  return (
    <DataTable
      caption="Clientes"
      rows={clients}
      columns={[
        { header: "Nombre", cell: (c) => c.name },
        { header: "Contacto", cell: (c) => c.contact_name },
        { header: "Correo", cell: (c) => c.email },
        { header: "Teléfono", cell: (c) => c.phone },
        {
          header: "Acciones",
          cell: (c) => (
            <>
              <button type="button" onClick={() => onEdit(c)}>
                Editar
              </button>
              <a href={`/admin/subscriptions?client_id=${c.id}`}>
                Suscripciones
              </a>
            </>
          ),
        },
      ]}
    />
  );
}
