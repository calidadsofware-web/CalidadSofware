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
import { saveClient, saveProduct, saveSupplier, adjustStock } from "./_shared/commands/catalog.js";
import { saveUser } from "./_shared/commands/users.js";
import { reviewPurchase, updateClaim, cancelQuotation } from "./_shared/commands/workflow.js";
import type { Fields } from "./_shared/commands/fields.js";
import { assertSameOrigin, errorResponse, HttpError, json, readJson } from "./_shared/http.js";

interface CommandBody {
  action?: unknown;
  payload?: unknown;
}

export default async function handler(request: Request): Promise<Response> {
  try {
    if (request.method === "GET") {
      try {
        const user = await requireAppUser(request);
        return json({ ok: true, data: { user, appData: await getAppData(user) } });
      } catch (error) {
        if (error instanceof HttpError && error.status === 401) {
          return json({ ok: true, data: { user: null, appData: null } }, 200, {
            "Set-Cookie": expiredSessionCookie(),
          });
        }
        throw error;
      }
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

    const user = await requireAppUser(request);
    let message: string;

    switch (action) {
      case "save-client":
        message = await saveClient(payload as Fields, user);
        break;
      case "save-product":
        message = await saveProduct(payload as Fields, user);
        break;
      case "save-supplier":
        message = await saveSupplier(payload as Fields, user);
        break;
      case "adjust-stock":
        message = await adjustStock(payload as Fields, user);
        break;
      case "save-user":
        message = await saveUser(payload as Fields, user);
        break;
      case "review-purchase":
        message = await reviewPurchase(payload as Fields, user);
        break;
      case "update-claim":
        message = await updateClaim(payload as Fields, user);
        break;
      case "cancel-quotation":
        message = await cancelQuotation(payload as Fields, user);
        break;
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
