export type AppRole = "ADMINISTRADOR" | "CAJERO" | "ALMACEN" | "ASISTENTE_COMPRAS";

export interface AppUser {
  id: number;
  email: string;
  fullName: string;
  role: AppRole;
  roleDisplay: string;
}

export interface Product {
  code: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  stock: number;
  minStock: number;
  price: number;
}

export interface Client {
  document: string;
  fullName: string;
  phone: string;
  email: string;
  lastPurchase: string;
  status: string;
}

export interface Supplier {
  ruc: string;
  businessName: string;
  contact: string;
  phone: string;
  email: string;
  status: string;
}

export interface PurchaseRequest {
  number: string;
  supplier: string;
  createdAt: string;
  status: string;
  requestedBy: string;
  estimatedTotal: number;
}

export interface Payment {
  document: string;
  client: string;
  date: string;
  method: string;
  status: string;
  total: number;
}

export interface Quotation {
  number: string;
  supplier: string;
  createdAt: string;
  requestedBy: string;
  productCount: number;
}

export interface Claim {
  id: number;
  client: string;
  date: string;
  reason: string;
  priority: string;
  status: string;
}

export interface PurchaseItem {
  code: string;
  name: string;
  ordered: number;
  received: number;
  pending: number;
}

export interface Purchase {
  number: string;
  supplier: string;
  date: string;
  status: string;
  items: PurchaseItem[];
}

export interface Metric {
  label: string;
  value: string;
  hint: string;
}

export interface AppData {
  user: AppUser;
  metrics: Metric[];
  products: Product[];
  clients: Client[];
  suppliers: Supplier[];
  purchaseRequests: PurchaseRequest[];
  quotationRequests: Quotation[];
  payments: Payment[];
  claims: Claim[];
  purchases: Purchase[];
}

export interface LineInput {
  code: string;
  quantity: number;
}

export type AppCommand = (action: string, payload: unknown) => Promise<void>;
