import type { Config } from "@netlify/functions";
import {
  APP_ROLES,
  expiredSessionCookie,
  POLICIES,
  requireAppUser,
  requireRole,
  sessionCookie,
  signIn,
} from "./_shared/auth.js";
import {
  registerClaim,
  registerPurchaseRequest,
  registerQuotation,
  registerReceipt,
  registerSale,
  type ClaimInput,
  type PurchaseRequestInput,
  type QuotationInput,
  type ReceiptInput,
  type SaleInput,
} from "./_shared/commands/index.js";
import { getAppData } from "./_shared/data.js";
import { assertSameOrigin, errorResponse, HttpError, json, readJson } from "./_shared/http.js";

interface CommandBody {
  action?: unknown;
  payload?: unknown;
}

export default async function handler(request: Request): Promise<Response> {
  try {
    if (request.method === "GET") {
      const user = await requireAppUser(request);
      return json({ ok: true, data: await getAppData(user) });
    }

    if (request.method !== "POST") {
      throw new HttpError(405, "Método no permitido.");
    }

    assertSameOrigin(request);
    const body = await readJson<CommandBody>(request);
    const action = typeof body.action === "string" ? body.action : "";
    const payload = typeof body.payload === "object" && body.payload !== null ? body.payload : {};

    if (action === "sign-in") {
      const credentials = payload as { email?: unknown; password?: unknown };
      const result = await signIn(credentials.email, credentials.password);
      return json({ ok: true, data: { user: result.user } }, 200, {
        "Set-Cookie": sessionCookie(result.session),
      });
    }

    if (action === "sign-out") {
      return json({ ok: true, data: {} }, 200, { "Set-Cookie": expiredSessionCookie() });
    }

    if (action === "session") {
      const user = await requireAppUser(request);
      return json({ ok: true, data: { user } });
    }

    const user = await requireAppUser(request);
    let message: string;

    switch (action) {
      case "register-sale":
        requireRole(user, POLICIES.sales);
        message = await registerSale(payload as SaleInput, user);
        break;
      case "register-receipt":
        requireRole(user, POLICIES.warehouse);
        message = await registerReceipt(payload as ReceiptInput, user);
        break;
      case "register-purchase-request":
        requireRole(user, POLICIES.procurement);
        message = await registerPurchaseRequest(payload as PurchaseRequestInput, user);
        break;
      case "register-quotation":
        requireRole(user, POLICIES.quotations);
        message = await registerQuotation(payload as QuotationInput, user);
        break;
      case "register-claim":
        requireRole(user, [APP_ROLES.administrator, APP_ROLES.cashier]);
        message = await registerClaim(payload as ClaimInput, user);
        break;
      default:
        throw new HttpError(400, "Operación no reconocida.");
    }

    return json({ ok: true, message });
  } catch (error) {
    return errorResponse(error);
  }
}

export const config: Config = {
  path: "/api/datacell",
};
