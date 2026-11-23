import { useForm } from "react-hook-form";
import ContactFields, { type ContactData } from "../molecules/ContactFields";
import FormActions from "../molecules/FormActions";

export type ClientData = ContactData;

// Sirve para crear (sin `client`) y para editar (con el cliente a editar).
export default function ClientForm({
  client,
  onSubmit,
  onCancel,
  error,
}: {
  client?: ClientData;
  onSubmit: (data: ClientData) => Promise<boolean>;
  onCancel: () => void;
  error: string;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientData>({ defaultValues: client });

  return (
    <form
      method="post"
      onSubmit={handleSubmit(async (data) => {
        if (await onSubmit(data)) reset();
      })}
    >
      <ContactFields prefix="client" register={register} errors={errors} />
      <FormActions
        submitLabel={client ? "Guardar cliente" : "Crear cliente"}
        isSubmitting={isSubmitting}
        onCancel={client && onCancel}
        error={error}
      />
    </form>
  );
}
