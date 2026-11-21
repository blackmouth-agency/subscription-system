import { useForm } from "react-hook-form";

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
  const trim = (value: string) => value.trim();

  return (
    <form
      method="post"
      onSubmit={handleSubmit(async (data) => {
        if (await onSubmit(data)) reset();
      })}
    >
      <label htmlFor="client-name">Nombre o razón social</label>
      <input
        id="client-name"
        {...register("name", {
          setValueAs: trim,
          required: "Escribe el nombre.",
          maxLength: { value: 100, message: "Máximo 100 caracteres." },
        })}
      />
      <span role="alert">{errors.name?.message}</span>
      <label htmlFor="client-contact">Contacto</label>
      <input
        id="client-contact"
        {...register("contact_name", {
          setValueAs: trim,
          maxLength: { value: 100, message: "Máximo 100 caracteres." },
        })}
      />
      <span role="alert">{errors.contact_name?.message}</span>
      <label htmlFor="client-email">Correo</label>
      <input
        id="client-email"
        type="email"
        {...register("email", { setValueAs: trim })}
      />
      <span role="alert">{errors.email?.message}</span>
      <label htmlFor="client-phone">Teléfono / WhatsApp</label>
      <input
        id="client-phone"
        type="tel"
        {...register("phone", {
          setValueAs: trim,
          maxLength: { value: 30, message: "Máximo 30 caracteres." },
        })}
      />
      <span role="alert">{errors.phone?.message}</span>
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
