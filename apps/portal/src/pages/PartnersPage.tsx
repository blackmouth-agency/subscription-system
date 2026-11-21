import { useAdminResource } from "../hooks/useAdminResource";
import PartnerForm, { type PartnerData } from "../organisms/PartnerForm";
import PartnerTable, { type Partner } from "../organisms/PartnerTable";
import FormTableTemplate from "../templates/FormTableTemplate";

export default function PartnersPage({ accessToken }: { accessToken: string }) {
  const { rows, editing, setEditing, save, error } = useAdminResource<
    Partner,
    PartnerData
  >("/partners", accessToken, {
    loadError: "No pudimos cargar los socios.",
    saveError: "No pudimos guardar el socio.",
  });

  return (
    <FormTableTemplate
      form={
        <PartnerForm
          key={editing?.id}
          partner={editing}
          onSubmit={save}
          onCancel={() => setEditing(undefined)}
          error={error}
        />
      }
      table={<PartnerTable partners={rows} onEdit={setEditing} />}
    />
  );
}
