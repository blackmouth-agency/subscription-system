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
    <table>
      <caption>Clientes</caption>
      <thead>
        <tr>
          <th scope="col">Nombre</th>
          <th scope="col">Contacto</th>
          <th scope="col">Correo</th>
          <th scope="col">Teléfono</th>
          <th scope="col">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {clients.map((client) => (
          <tr key={client.id}>
            <td>{client.name}</td>
            <td>{client.contact_name}</td>
            <td>{client.email}</td>
            <td>{client.phone}</td>
            <td>
              <button type="button" onClick={() => onEdit(client)}>
                Editar
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
