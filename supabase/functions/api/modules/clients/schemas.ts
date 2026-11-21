import { z } from "zod";

const fields = {
  name: z.string().trim().min(1).max(100),
  contact_name: z.string().trim().max(100),
  email: z.union([z.literal(""), z.string().trim().email().max(254)]),
  phone: z.string().trim().max(30),
};

export const createClientBody = z.object({
  name: fields.name,
  contact_name: fields.contact_name.default(""),
  email: fields.email.default(""),
  phone: fields.phone.default(""),
});

export const updateClientBody = z.object(fields).partial().refine(
  (body) => Object.keys(body).length > 0,
);
