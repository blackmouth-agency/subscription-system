import { useForm } from "react-hook-form";
import { maxLength, trim } from "../forms";
import FormField from "../molecules/FormField";

export type ClientData = {
  name: string;
  contact_name: string;
  email: string;
  phone: string;
};

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
      <FormField
        id="client-name"
        label="Nombre o razón social"
        error={errors.name?.message}
        {...register("name", {
          setValueAs: trim,
          required: "Escribe el nombre.",
          maxLength: maxLength(100),
        })}
      />
      <FormField
        id="client-contact"
        label="Contacto"
        error={errors.contact_name?.message}
        {...register("contact_name", {
          setValueAs: trim,
          maxLength: maxLength(100),
        })}
      />
      <FormField
        id="client-email"
        label="Correo"
        type="email"
        error={errors.email?.message}
        {...register("email", { setValueAs: trim })}
      />
      <FormField
        id="client-phone"
        label="Teléfono / WhatsApp"
        type="tel"
        error={errors.phone?.message}
        {...register("phone", { setValueAs: trim, maxLength: maxLength(30) })}
      />
      <button type="submit" disabled={isSubmitting}>
        {client ? "Guardar cliente" : "Crear cliente"}
      </button>
      {client && (
        <button type="button" onClick={onCancel}>
          Cancelar
        </button>
      )}
      <p role="alert">{error}</p>
    </form>
  );
}
