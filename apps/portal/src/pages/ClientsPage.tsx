import { useEffect, useMemo, useState } from "react";
import { createApi } from "../api";
import ClientForm, { type ClientData } from "../organisms/ClientForm";
import ClientTable, { type Client } from "../organisms/ClientTable";
import ClientsTemplate from "../templates/ClientsTemplate";

const byName = (a: Client, b: Client) => a.name.localeCompare(b.name);

export default function ClientsPage({ accessToken }: { accessToken: string }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [editing, setEditing] = useState<Client>();
  const [error, setError] = useState("");

  const api = useMemo(() => createApi(accessToken), [accessToken]);

  useEffect(() => {
    api
      .get<Client[]>("/clients")
      .then(({ data }) => setClients(data))
      .catch(() => setError("No pudimos cargar los clientes."));
  }, [api]);

  // Devuelve true si guardó, para que el formulario se limpie.
  async function saveClient(data: ClientData): Promise<boolean> {
    try {
      if (editing) {
        const { data: saved } = await api.patch<Client>(
          `/clients/${editing.id}`,
          data,
        );
        setClients((current) =>
          current.map((c) => (c.id === saved.id ? saved : c)).sort(byName),
        );
        setEditing(undefined);
      } else {
        const { data: saved } = await api.post<Client>("/clients", data);
        setClients((current) => [...current, saved].sort(byName));
      }
      setError("");
      return true;
    } catch {
      setError("No pudimos guardar el cliente.");
      return false;
    }
  }

  return (
    <ClientsTemplate
      form={
        <ClientForm
          key={editing?.id}
          client={editing}
          onSubmit={saveClient}
          onCancel={() => setEditing(undefined)}
          error={error}
        />
      }
      table={<ClientTable clients={clients} onEdit={setEditing} />}
    />
  );
}
