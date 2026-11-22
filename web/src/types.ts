export type AppRole = "ADMINISTRADOR" | "CAJERO" | "ALMACEN" | "ASISTENTE_COMPRAS";

export interface AppUser {
  id: number;
  email: string;
  fullName: string;
  role: AppRole;
  roleDisplay: string;
}

export interface Product {
  barcode?: string;
  cost?: number | null;
  status?: string;
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
  id?: number;
  firstName?: string;
  lastName?: string;
  address?: string;
  document: string;
  fullName: string;
  phone: string;
  email: string;
  lastPurchase: string;
  status: string;
}

export interface Supplier {
  id?: number;
  address?: string;
  ruc: string;
  businessName: string;
  contact: string;
  phone: string;
  email: string;
  status: string;
}

export interface PurchaseRequest {
  id?: number;
  supplierId?: number | null;
  priority?: string;
  requiredDate?: string;
  notes?: string;
  items?: LineInput[];
  number: string;
  supplier: string;
  createdAt: string;
  status: string;
  requestedBy: string;
  estimatedTotal: number;
}

export interface Payment {
  subtotal?: number;
  tax?: number;
  notes?: string;
  items?: { name: string; quantity: number; price: number }[];
  id?: number;
  clientId?: number;
  reference?: string;
  document: string;
  client: string;
  /** Usuario que registró la venta (RF08: consulta por cajero). */
  cashier?: string;
  /** Productos vendidos, para buscar el historial por producto (RF08). */
  products?: string;
  date: string;
  method: string;
  status: string;
  total: number;
}

export interface Quotation {
  id?: number;
  deadline?: string;
  notes?: string;
  status?: string;
  items?: LineInput[];
  number: string;
  supplier: string;
  createdAt: string;
  requestedBy: string;
  productCount: number;
}

export interface Claim {
  clientId?: number;
  receiptNumber?: string;
  description?: string;
  channel?: string;
  resolution?: string;
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
  users?: ManagedUser[];
  categories?: string[];
  brands?: string[];
  movements?: InventoryMovement[];
  receipts?: ReceiptRecord[];
  local?: boolean;
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

export interface ManagedUser extends AppUser {
  firstName: string;
  lastName: string;
  status: string;
  createdAt: string;
}

export interface InventoryMovement {
  id: number;
  code: string;
  product: string;
  date: string;
  type: string;
  quantity: number;
  before: number;
  after: number;
  notes: string;
  responsible: string;
}

export interface ReceiptRecord {
  number: string;
  purchase: string;
  supplier: string;
  date: string;
  guide: string;
  notes: string;
}
