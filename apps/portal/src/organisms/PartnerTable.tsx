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
    <table>
      <caption>Socios</caption>
      <thead>
        <tr>
          <th scope="col">Nombre</th>
          <th scope="col">Contacto</th>
          <th scope="col">Correo</th>
          <th scope="col">Teléfono</th>
          <th scope="col">Cuenta receptora</th>
          <th scope="col">Estado</th>
          <th scope="col">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {partners.map((partner) => (
          <tr key={partner.id}>
            <td>{partner.name}</td>
            <td>{partner.contact_name}</td>
            <td>{partner.email}</td>
            <td>{partner.phone}</td>
            <td>{partner.receiving_account}</td>
            <td>{partner.is_active ? "Activo" : "Inactivo"}</td>
            <td>
              <button type="button" onClick={() => onEdit(partner)}>
                Editar
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
