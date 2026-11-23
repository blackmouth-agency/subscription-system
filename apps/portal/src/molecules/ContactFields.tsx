import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { requiredName, text, trim } from "../forms";
import FormField from "./FormField";

export type ContactData = {
  name: string;
  contact_name: string;
  email: string;
  phone: string;
};

// Nombre, contacto, correo y teléfono: comunes a clientes y socios.
export default function ContactFields<T extends ContactData>({
  prefix,
  register,
  errors,
}: {
  prefix: string;
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
}) {
  // Los nombres de campo de T no se resuelven en genérico: un solo cast.
  const reg = register as unknown as UseFormRegister<ContactData>;
  const err = errors as FieldErrors<ContactData>;
  return (
    <>
      <FormField
        id={`${prefix}-name`}
        label="Nombre o razón social"
        error={err.name?.message}
        {...reg("name", requiredName)}
      />
      <FormField
        id={`${prefix}-contact`}
        label="Contacto"
        error={err.contact_name?.message}
        {...reg("contact_name", text(100))}
      />
      <FormField
        id={`${prefix}-email`}
        label="Correo"
        type="email"
        error={err.email?.message}
        {...reg("email", { setValueAs: trim })}
      />
      <FormField
        id={`${prefix}-phone`}
        label="Teléfono / WhatsApp"
        type="tel"
        error={err.phone?.message}
        {...reg("phone", text(30))}
      />
    </>
  );
}
