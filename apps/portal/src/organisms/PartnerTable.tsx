import DataTable from "../molecules/DataTable";

export type Partner = {
  id: string;
  name: string;
  contact_name: string;
  email: string;
  phone: string;
  receiving_account: string;
  is_active: boolean;
};

export default function PartnerTable({
  partners,
  onEdit,
}: {
  partners: Partner[];
  onEdit: (partner: Partner) => void;
}) {
  return (
    <DataTable
      caption="Socios"
      rows={partners}
      columns={[
        { header: "Nombre", cell: (p) => p.name },
        { header: "Contacto", cell: (p) => p.contact_name },
        { header: "Correo", cell: (p) => p.email },
        { header: "Teléfono", cell: (p) => p.phone },
        { header: "Cuenta receptora", cell: (p) => p.receiving_account },
        {
          header: "Estado",
          cell: (p) => (p.is_active ? "Activo" : "Inactivo"),
        },
        {
          header: "Acciones",
          cell: (p) => (
            <button type="button" onClick={() => onEdit(p)}>
              Editar
            </button>
          ),
        },
      ]}
    />
  );
}
