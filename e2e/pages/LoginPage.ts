import { expect, type Locator, type Page } from "@playwright/test";

/** Page Object de la pantalla "Iniciar sesión". */
export class LoginPage {
  readonly correo: Locator;
  readonly clave: Locator;
  readonly ingresar: Locator;
  readonly error: Locator;

  constructor(private readonly page: Page) {
    this.correo = page.getByLabel("Correo electrónico");
    this.clave = page.getByLabel("Contraseña");
    this.ingresar = page.getByRole("button", { name: "Ingresar" });
    this.error = page.getByRole("alert");
  }

  async abrir() {
    await this.page.goto("/");
    await expect(this.page.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();
    await expect(this.ingresar).toBeEnabled(); // espera a que termine "Comprobando sesión..."
  }

  async ingresarCredenciales(correo: string, clave: string) {
    await this.correo.fill(correo);
    await this.clave.fill(clave);
  }

  async enviar() {
    await this.ingresar.click();
  }
}
