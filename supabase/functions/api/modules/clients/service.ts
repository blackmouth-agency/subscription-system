import { crudService } from "../../shared/crud.ts";

type Client = {
  id: string;
  name: string;
  contact_name: string;
  email: string;
  phone: string;
  created_at: string;
  updated_at: string;
};

export const service = crudService<Client>({
  table: "clients",
  notFound: "Cliente no encontrado",
});
