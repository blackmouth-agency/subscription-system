import { useAdminResource } from "../hooks/useAdminResource";
import ClientForm, { type ClientData } from "../organisms/ClientForm";
import ClientTable, { type Client } from "../organisms/ClientTable";
import FormTableTemplate from "../templates/FormTableTemplate";

export default function ClientsPage({ accessToken }: { accessToken: string }) {
  const { rows, editing, setEditing, save, error } = useAdminResource<
    Client,
    ClientData
  >("/clients", accessToken, {
    loadError: "No pudimos cargar los clientes.",
    saveError: "No pudimos guardar el cliente.",
  });

  return (
    <FormTableTemplate
      form={
        <ClientForm
          key={editing?.id}
          client={editing}
          onSubmit={save}
          onCancel={() => setEditing(undefined)}
          error={error}
        />
      }
      table={<ClientTable clients={rows} onEdit={setEditing} />}
    />
  );
}
