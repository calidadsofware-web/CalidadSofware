export interface ItemInput {
  code?: unknown;
  quantity?: unknown;
}

export interface CommandLine {
  code: string;
  quantity: number;
}

export interface ProductRecord {
  id_producto: number;
  codigo: string;
  nombre: string;
  precio_compra: string;
  precio_venta: string;
  stock: number;
}

export interface SaleInput {
  receiptType?: unknown;
  clientName?: unknown;
  clientDocument?: unknown;
  paymentMethod?: unknown;
  items?: unknown;
}

export interface ReceiptInput {
  purchaseNumber?: unknown;
  guide?: unknown;
  entryDate?: unknown;
  notes?: unknown;
  items?: unknown;
}

export interface PurchaseRequestInput {
  supplierName?: unknown;
  priority?: unknown;
  requiredDate?: unknown;
  justification?: unknown;
  items?: unknown;
}

export interface QuotationInput {
  deadline?: unknown;
  notes?: unknown;
  supplierNames?: unknown;
  items?: unknown;
}

export interface ClaimInput {
  clientName?: unknown;
  receiptNumber?: unknown;
  reason?: unknown;
  channel?: unknown;
  priority?: unknown;
  description?: unknown;
}
