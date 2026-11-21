import { crudService } from "../../shared/crud.ts";

type Partner = {
  id: string;
  name: string;
  contact_name: string;
  email: string;
  phone: string;
  receiving_account: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export const service = crudService<Partner>({
  table: "partners",
  notFound: "Socio no encontrado",
});
