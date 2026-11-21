import { z } from "zod";

// El cliente envía su JWT y la apikey (clave publicable) en cada llamada.
export const authHeaders = z.object({
  authorization: z.string().startsWith("Bearer "),
  apikey: z.string().min(1),
});

export const idParam = z.object({ id: z.string().uuid() });

// Campos de contacto comunes a clients y partners.
export const contactFields = {
  name: z.string().trim().min(1).max(100),
  contact_name: z.string().trim().max(100),
  email: z.union([z.literal(""), z.string().trim().email().max(254)]),
  phone: z.string().trim().max(30),
};

// Al crear, todo es opcional salvo `name`.
export const contactCreate = {
  name: contactFields.name,
  contact_name: contactFields.contact_name.default(""),
  email: contactFields.email.default(""),
  phone: contactFields.phone.default(""),
};

// Cambios parciales: al menos un campo.
export const updateBody = <T extends z.ZodRawShape>(fields: T) =>
  z.object(fields).partial().refine((body) => Object.keys(body).length > 0);
