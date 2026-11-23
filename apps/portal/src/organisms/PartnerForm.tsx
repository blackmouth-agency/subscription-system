import { useForm } from "react-hook-form";
import { text } from "../forms";
import ContactFields, { type ContactData } from "../molecules/ContactFields";
import FormActions from "../molecules/FormActions";
import FormField from "../molecules/FormField";

export type PartnerData = ContactData & {
  receiving_account: string;
  is_active: boolean;
};

// Sirve para crear (sin `partner`) y para editar (con el socio a editar).
export default function PartnerForm({
  partner,
  onSubmit,
  onCancel,
  error,
}: {
  partner?: PartnerData;
  onSubmit: (data: PartnerData) => Promise<boolean>;
  onCancel: () => void;
  error: string;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PartnerData>({
    defaultValues: partner ?? { is_active: true },
  });

  return (
    <form
      method="post"
      onSubmit={handleSubmit(async (data) => {
        if (await onSubmit(data)) reset({ is_active: true });
      })}
    >
      <ContactFields prefix="partner" register={register} errors={errors} />
      <FormField
        id="partner-account"
        label="Cuenta receptora"
        error={errors.receiving_account?.message}
        {...register("receiving_account", text(200))}
      />
      <input id="partner-active" type="checkbox" {...register("is_active")} />
      <label htmlFor="partner-active">Activo</label>
      <FormActions
        submitLabel={partner ? "Guardar socio" : "Crear socio"}
        isSubmitting={isSubmitting}
        onCancel={partner && onCancel}
        error={error}
      />
    </form>
  );
}
