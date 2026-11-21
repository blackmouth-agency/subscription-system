import { expect, test } from "@playwright/test";
import { createUser, signInAt } from "./helpers";

test("un admin ve el área de administración", async ({ page }) => {
  await signInAt(page, await createUser(true));

  await expect(
    page.getByRole("heading", { name: "Administración" }),
  ).toBeVisible();
  await expect(page.getByText("Sin acceso")).toHaveCount(0);
});

test("una cuenta sin el rol ve sin acceso y conserva perfil y cerrar sesión", async ({
  page,
}) => {
  await signInAt(page, await createUser(false));

  await expect(page.getByText("Sin acceso")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Administración" }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Mi perfil" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Cerrar sesión" }),
  ).toBeVisible();
});
