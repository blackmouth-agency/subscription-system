import { crudRoutes } from "../../shared/crud.ts";
import { createProduct } from "./schemas.ts";
import { service } from "./service.ts";

export const products = crudRoutes(service, { create: createProduct });
