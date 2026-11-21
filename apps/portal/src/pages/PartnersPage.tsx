import { useEffect, useMemo, useState } from "react";
import { createApi } from "../api";
import PartnerForm, { type PartnerData } from "../organisms/PartnerForm";
import PartnerTable, { type Partner } from "../organisms/PartnerTable";
import PartnersTemplate from "../templates/PartnersTemplate";

const byName = (a: Partner, b: Partner) => a.name.localeCompare(b.name);

export default function PartnersPage({ accessToken }: { accessToken: string }) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [editing, setEditing] = useState<Partner>();
  const [error, setError] = useState("");

  const api = useMemo(() => createApi(accessToken), [accessToken]);

  useEffect(() => {
    api
      .get<Partner[]>("/partners")
      .then(({ data }) => setPartners(data))
      .catch(() => setError("No pudimos cargar los socios."));
  }, [api]);

  // Devuelve true si guardó, para que el formulario se limpie.
  async function savePartner(data: PartnerData): Promise<boolean> {
    try {
      if (editing) {
        const { data: saved } = await api.patch<Partner>(
          `/partners/${editing.id}`,
          data,
        );
        setPartners((current) =>
          current.map((c) => (c.id === saved.id ? saved : c)).sort(byName),
        );
        setEditing(undefined);
      } else {
        const { data: saved } = await api.post<Partner>("/partners", data);
        setPartners((current) => [...current, saved].sort(byName));
      }
      setError("");
      return true;
    } catch {
      setError("No pudimos guardar el socio.");
      return false;
    }
  }

  return (
    <PartnersTemplate
      form={
        <PartnerForm
          key={editing?.id}
          partner={editing}
          onSubmit={savePartner}
          onCancel={() => setEditing(undefined)}
          error={error}
        />
      }
      table={<PartnerTable partners={partners} onEdit={setEditing} />}
    />
  );
}
