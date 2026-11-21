import { useEffect, useMemo, useState } from "react";
import { createApi } from "../api";

type Row = { id: string; name: string };

const byName = (a: Row, b: Row) => a.name.localeCompare(b.name);

// Datos de una página admin: lista `GET path`, crea con `POST path` o, si hay
// una fila en `editing`, la edita con `PATCH path/:id`. `save` devuelve true
// si guardó, para que el formulario se limpie.
export function useAdminResource<T extends Row, Body>(
  path: string,
  accessToken: string,
  messages: { loadError: string; saveError: string },
) {
  const [rows, setRows] = useState<T[]>([]);
  const [editing, setEditing] = useState<T>();
  const [error, setError] = useState("");

  const api = useMemo(() => createApi(accessToken), [accessToken]);
  const { loadError, saveError } = messages;

  useEffect(() => {
    api
      .get<T[]>(path)
      .then(({ data }) => setRows(data))
      .catch(() => setError(loadError));
  }, [api, path, loadError]);

  async function save(body: Body): Promise<boolean> {
    try {
      if (editing) {
        const { data } = await api.patch<T>(`${path}/${editing.id}`, body);
        setRows((current) =>
          current.map((r) => (r.id === data.id ? data : r)).sort(byName),
        );
        setEditing(undefined);
      } else {
        const { data } = await api.post<T>(path, body);
        setRows((current) => [...current, data].sort(byName));
      }
      setError("");
      return true;
    } catch {
      setError(saveError);
      return false;
    }
  }

  return { rows, editing, setEditing, save, error };
}
