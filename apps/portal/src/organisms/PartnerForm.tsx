import { useForm } from "react-hook-form";

export type PartnerData = {
  name: string;
  contact_name: string;
  email: string;
  phone: string;
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
  const trim = (value: string) => value.trim();

  return (
    <form
      method="post"
      onSubmit={handleSubmit(async (data) => {
        if (await onSubmit(data)) reset({ is_active: true });
      })}
    >
      <label htmlFor="partner-name">Nombre o razón social</label>
      <input
        id="partner-name"
        {...register("name", {
          setValueAs: trim,
          required: "Escribe el nombre.",
          maxLength: { value: 100, message: "Máximo 100 caracteres." },
        })}
      />
      <span role="alert">{errors.name?.message}</span>
      <label htmlFor="partner-contact">Contacto</label>
      <input
        id="partner-contact"
        {...register("contact_name", {
          setValueAs: trim,
          maxLength: { value: 100, message: "Máximo 100 caracteres." },
        })}
      />
      <span role="alert">{errors.contact_name?.message}</span>
      <label htmlFor="partner-email">Correo</label>
      <input
        id="partner-email"
        type="email"
        {...register("email", { setValueAs: trim })}
      />
      <span role="alert">{errors.email?.message}</span>
      <label htmlFor="partner-phone">Teléfono / WhatsApp</label>
      <input
        id="partner-phone"
        type="tel"
        {...register("phone", {
          setValueAs: trim,
          maxLength: { value: 30, message: "Máximo 30 caracteres." },
        })}
      />
      <span role="alert">{errors.phone?.message}</span>
      <label htmlFor="partner-account">Cuenta receptora</label>
      <input
        id="partner-account"
        {...register("receiving_account", {
          setValueAs: trim,
          maxLength: { value: 200, message: "Máximo 200 caracteres." },
        })}
      />
      <span role="alert">{errors.receiving_account?.message}</span>
      <input id="partner-active" type="checkbox" {...register("is_active")} />
      <label htmlFor="partner-active">Activo</label>
      <button type="submit" disabled={isSubmitting}>
        {partner ? "Guardar socio" : "Crear socio"}
      </button>
      {partner && (
        <button type="button" onClick={onCancel}>
          Cancelar
        </button>
      )}
      <p role="alert">{error}</p>
    </form>
  );
}
