import { useForm } from "react-hook-form";
import { maxLength, trim } from "../forms";
import FormField from "../molecules/FormField";

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

  return (
    <form
      method="post"
      onSubmit={handleSubmit(async (data) => {
        if (await onSubmit(data)) reset({ is_active: true });
      })}
    >
      <FormField
        id="partner-name"
        label="Nombre o razón social"
        error={errors.name?.message}
        {...register("name", {
          setValueAs: trim,
          required: "Escribe el nombre.",
          maxLength: maxLength(100),
        })}
      />
      <FormField
        id="partner-contact"
        label="Contacto"
        error={errors.contact_name?.message}
        {...register("contact_name", {
          setValueAs: trim,
          maxLength: maxLength(100),
        })}
      />
      <FormField
        id="partner-email"
        label="Correo"
        type="email"
        error={errors.email?.message}
        {...register("email", { setValueAs: trim })}
      />
      <FormField
        id="partner-phone"
        label="Teléfono / WhatsApp"
        type="tel"
        error={errors.phone?.message}
        {...register("phone", { setValueAs: trim, maxLength: maxLength(30) })}
      />
      <FormField
        id="partner-account"
        label="Cuenta receptora"
        error={errors.receiving_account?.message}
        {...register("receiving_account", {
          setValueAs: trim,
          maxLength: maxLength(200),
        })}
      />
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
