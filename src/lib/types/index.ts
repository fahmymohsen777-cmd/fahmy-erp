// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'sales' | 'warehouse' | 'driver';

export type CharcoalType = 'orange' | 'lemon' | 'guava' | 'mango' | 'mixed';

export type OrderStatus = 'pending' | 'in_delivery' | 'delivered' | 'collected';

export type PaymentType = 'full' | 'partial' | 'installment';

export type MovementType = 'in' | 'out' | 'damaged' | 'reserved' | 'return';

export type NotificationType =
  | 'overdue_balance'
  | 'no_payment_30_days'
  | 'no_order_recently'
  | 'low_stock'
  | 'supplier_payment_due';

// ─── User & Auth ──────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  created_at: string;
}

// ─── Customer ─────────────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  cafe_name: string;
  owner_name: string;
  phone: string;
  whatsapp?: string;
  address: string;
  maps_link?: string;
  monthly_consumption?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Computed
  total_purchases?: number;
  total_payments?: number;
  outstanding_balance?: number;
}

// ─── Supplier ─────────────────────────────────────────────────────────────────

export interface Supplier {
  id: string;
  name: string;
  charcoal_type: CharcoalType;
  price_per_kg: number;
  price_per_bag: number;
  bag_weight_kg: number;
  delivery_cost: number;
  phone?: string;
  notes?: string;
  outstanding_balance: number;
  created_at: string;
  updated_at: string;
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export interface InventoryItem {
  id: string;
  charcoal_type: CharcoalType;
  warehouse_stock: number;
  incoming_stock: number;
  outgoing_stock: number;
  damaged_stock: number;
  reserved_stock: number;
  minimum_stock: number;
  updated_at: string;
}

export interface InventoryMovement {
  id: string;
  charcoal_type: CharcoalType;
  movement_type: MovementType;
  quantity: number;
  supplier_id?: string;
  customer_id?: string;
  order_id?: string;
  user_id: string;
  notes?: string;
  created_at: string;
  // Joined
  supplier?: Supplier;
  customer?: Customer;
  user?: Profile;
}

// ─── Order ────────────────────────────────────────────────────────────────────

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  driver_id?: string;
  status: OrderStatus;
  delivery_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined
  customer?: Customer;
  driver?: Profile;
  items?: OrderItem[];
  // Computed
  total_amount?: number;
  total_quantity?: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  charcoal_type: CharcoalType;
  quantity: number;
  price_per_unit: number;
  total_price: number;
}

// ─── Payment / Collection ─────────────────────────────────────────────────────

export interface Payment {
  id: string;
  customer_id: string;
  order_id?: string;
  amount: number;
  payment_type: PaymentType;
  payment_date: string;
  notes?: string;
  collected_by?: string;
  created_at: string;
  // Joined
  customer?: Customer;
  order?: Order;
  collector?: Profile;
}

// ─── Expense ──────────────────────────────────────────────────────────────────

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  expense_date: string;
  created_by: string;
  created_at: string;
}

// ─── Supplier Payment ─────────────────────────────────────────────────────────

export interface SupplierPayment {
  id: string;
  supplier_id: string;
  amount: number;
  payment_date: string;
  notes?: string;
  created_at: string;
  supplier?: Supplier;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  customer_id?: string;
  supplier_id?: string;
  is_read: boolean;
  created_at: string;
  customer?: Customer;
  supplier?: Supplier;
}

// ─── Dashboard / Analytics ────────────────────────────────────────────────────

export interface DashboardStats {
  today_sales: number;
  today_deliveries: number;
  today_net_profit: number;
  monthly_profit: number;
  monthly_revenue: number;
  outstanding_customer_debts: number;
  supplier_balances: number;
  revenue_growth_pct: number;
  profit_growth_pct: number;
  customer_growth_pct: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface TopCustomer {
  customer_id: string;
  cafe_name: string;
  total_purchases: number;
  outstanding_balance: number;
}

export interface CharcoalTypeSales {
  charcoal_type: CharcoalType;
  quantity: number;
  revenue: number;
}

// ─── Report ───────────────────────────────────────────────────────────────────

export type ReportPeriod = 'daily' | 'weekly' | 'monthly';

export interface Report {
  period: ReportPeriod;
  start_date: string;
  end_date: string;
  total_revenue: number;
  total_cost: number;
  net_profit: number;
  total_orders: number;
  total_deliveries: number;
  total_collections: number;
  top_customers: TopCustomer[];
  charcoal_sales: CharcoalTypeSales[];
}
