import { useEffect, useMemo, useState } from "react";
import { createApi } from "../api";

type Row = { id: string };

const byName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name);

// Datos de una página admin: lista `GET path`, crea con `POST path` o, si hay
// una fila en `editing`, la edita con `PATCH path/:id`. `save` devuelve true
// si guardó, para que el formulario se limpie.
export function useAdminResource<T extends Row, Body>(
  path: string,
  accessToken: string,
  messages: { loadError: string; saveError: string },
  // Sin `name` (p. ej. suscripciones) hay que pasar el orden.
  compare: (a: T, b: T) => number = byName as never,
) {
  const [rows, setRows] = useState<T[]>([]);
  const [editing, setEditing] = useState<T>();
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  const api = useMemo(() => createApi(accessToken), [accessToken]);
  const { loadError, saveError } = messages;

  useEffect(() => {
    api
      .get<T[]>(path)
      .then(({ data }) => setRows(data))
      .catch(() => setError(loadError));
  }, [api, path, loadError, version]);

  async function save(body: Body): Promise<boolean> {
    try {
      if (editing) {
        const { data } = await api.patch<T>(`${path}/${editing.id}`, body);
        setRows((current) =>
          current.map((r) => (r.id === data.id ? data : r)).sort(compare),
        );
        setEditing(undefined);
      } else {
        const { data } = await api.post<T>(path, body);
        setRows((current) => [...current, data].sort(compare));
      }
      setError("");
      return true;
    } catch {
      setError(saveError);
      return false;
    }
  }

  // `POST path/:id/action`: la API devuelve la fila actualizada.
  async function act(id: string, action: string, body: object) {
    try {
      const { data } = await api.post<T>(`${path}/${id}/${action}`, body);
      setRows((current) => current.map((r) => (r.id === data.id ? data : r)));
      setError("");
    } catch {
      setError(saveError);
    }
  }

  // Vuelve a pedir la lista (p. ej. tras un cambio que hizo otra ruta).
  const reload = () => setVersion((v) => v + 1);

  return { rows, editing, setEditing, save, act, reload, error };
}
