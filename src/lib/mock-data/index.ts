import {
  User,
  Customer,
  Supplier,
  InventoryItem,
  InventoryMovement,
  Order,
  Payment,
  Expense,
  SupplierPayment,
  AppNotification,
  DashboardStats,
  CharcoalType
} from '../types';

export const mockUsers: User[] = [];

export const mockCustomers: Customer[] = [];

export const mockSuppliers: Supplier[] = [];

export const mockInventory: InventoryItem[] = [
  { id: '1', charcoal_type: 'orange', warehouse_stock: 0, incoming_stock: 0, outgoing_stock: 0, damaged_stock: 0, reserved_stock: 0, minimum_stock: 100, updated_at: new Date().toISOString() },
  { id: '2', charcoal_type: 'lemon', warehouse_stock: 0, incoming_stock: 0, outgoing_stock: 0, damaged_stock: 0, reserved_stock: 0, minimum_stock: 80, updated_at: new Date().toISOString() },
  { id: '3', charcoal_type: 'guava', warehouse_stock: 0, incoming_stock: 0, outgoing_stock: 0, damaged_stock: 0, reserved_stock: 0, minimum_stock: 100, updated_at: new Date().toISOString() },
  { id: '4', charcoal_type: 'mango', warehouse_stock: 0, incoming_stock: 0, outgoing_stock: 0, damaged_stock: 0, reserved_stock: 0, minimum_stock: 60, updated_at: new Date().toISOString() },
  { id: '5', charcoal_type: 'mixed', warehouse_stock: 0, incoming_stock: 0, outgoing_stock: 0, damaged_stock: 0, reserved_stock: 0, minimum_stock: 50, updated_at: new Date().toISOString() },
];

export const mockMovements: InventoryMovement[] = [];

export const mockOrders: Order[] = [];

export const mockPayments: Payment[] = [];

export const mockExpenses: Expense[] = [];

export const mockSupplierPayments: SupplierPayment[] = [];

export const mockNotifications: AppNotification[] = [];

export const mockDashboardStats: DashboardStats = {
  today_sales: 0,
  today_deliveries: 0,
  today_net_profit: 0,
  monthly_revenue: 0,
  monthly_profit: 0,
  outstanding_customer_debts: 0,
  supplier_balances: 0,
  revenue_growth_pct: 0,
  profit_growth_pct: 0,
  customer_growth_pct: 0,
};

export const mockTopCustomers = [];

export const mockCharcoalSales = [];

export const mockDailySalesData = [];
export const mockMonthlyProfitData = [];
export const mockCashFlowData = [];
