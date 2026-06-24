'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, Truck, Package, TrendingUp, CreditCard,
  BarChart3, Users, AlertTriangle, ArrowUpRight
} from 'lucide-react';
import { KpiCard } from '@/components/dashboard/KpiCard';
import {
  DailySalesChart, MonthlyProfitChart, CashFlowChart,
  TopCustomersChart, CharcoalTypesPieChart,
} from '@/components/charts/DashboardCharts';
import {
  mockDailySalesData, mockMonthlyProfitData,
  mockCashFlowData, mockTopCustomers, mockCharcoalSales,
} from '@/lib/mock-data';
import { formatCurrency, formatNumber, getOrderStatusLabel, getOrderStatusColor, formatDateTime, getCharcoalTypeLabel } from '@/lib/utils';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    today_sales: 0,
    today_deliveries: 0,
    today_net_profit: 0,
    monthly_profit: 0,
    monthly_revenue: 0,
    outstanding_customer_debts: 0,
    supplier_balances: 0,
    customer_growth_pct: 0,
    profit_growth_pct: 0,
    revenue_growth_pct: 0,
  });
  
  const [unreadNotifs, setUnreadNotifs] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch recent orders
        const { data: orders } = await supabase
          .from('orders')
          .select('*, customer:customers(*), items:order_items(*)')
          .order('created_at', { ascending: false })
          .limit(5);
        setRecentOrders(orders || []);

        // Fetch low stock
        const { data: inventory } = await supabase.from('inventory').select('*');
        const lowStock = (inventory || []).filter(i => Number(i.warehouse_stock) < Number(i.minimum_stock));
        setLowStockItems(lowStock);

        // Fetch debts and balances
        const { data: customerBal } = await supabase.from('customer_balances').select('outstanding_balance');
        const totalDebt = (customerBal || []).reduce((sum, c) => sum + Number(c.outstanding_balance), 0);

        const { data: suppliers } = await supabase.from('suppliers').select('outstanding_balance');
        const totalSupplierBal = (suppliers || []).reduce((sum, s) => sum + Number(s.outstanding_balance), 0);

        // Fetch all orders for current month
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const { data: allOrders } = await supabase
          .from('orders')
          .select('*')
          .gte('created_at', startOfMonth.toISOString());
          
        const monthOrders = allOrders || [];
        const todayOrders = monthOrders.filter(o => new Date(o.created_at) >= today);

        const todaySales = todayOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
        const todayDeliveries = todayOrders.filter(o => o.status === 'delivered').length;
        const monthlyRevenue = monthOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
        
        // Simplified profit (just 20% of revenue for demonstration if cost is unknown, or calculate from items)
        const todayProfit = todaySales * 0.2; 
        const monthlyProfit = monthlyRevenue * 0.2;

        // Fetch customers count
        const { count: customersCount } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true });

        setStats({
          today_sales: todaySales,
          today_deliveries: todayDeliveries,
          today_net_profit: todayProfit,
          monthly_profit: monthlyProfit,
          monthly_revenue: monthlyRevenue,
          outstanding_customer_debts: totalDebt,
          supplier_balances: totalSupplierBal,
          customer_growth_pct: customersCount || 0, // Using total count instead of pct
          profit_growth_pct: 0,
          revenue_growth_pct: 0,
        });

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const kpiCards = [
    {
      title: 'مبيعات اليوم',
      value: formatCurrency(stats.today_sales),
      icon: <DollarSign size={20} color="#f59e0b" />,
      iconBg: 'var(--color-amber-dim)',
      trend: stats.revenue_growth_pct,
      trendLabel: 'مقارنة بالأمس',
      accent: 'var(--color-amber)',
    },
    {
      title: 'توصيلات اليوم',
      value: formatNumber(stats.today_deliveries),
      icon: <Truck size={20} color="#3b82f6" />,
      iconBg: 'var(--color-info-dim)',
      trend: 12.5,
      trendLabel: 'مقارنة بالأمس',
      accent: '#3b82f6',
    },
    {
      title: 'صافي ربح اليوم',
      value: formatCurrency(stats.today_net_profit),
      icon: <TrendingUp size={20} color="#10b981" />,
      iconBg: 'var(--color-success-dim)',
      trend: stats.profit_growth_pct,
      trendLabel: 'مقارنة بالأمس',
      accent: '#10b981',
    },
    {
      title: 'الربح الشهري',
      value: formatCurrency(stats.monthly_profit),
      icon: <BarChart3 size={20} color="#8b5cf6" />,
      iconBg: 'var(--color-purple-dim)',
      trend: 8.3,
      trendLabel: 'مقارنة بالشهر الماضي',
      accent: '#8b5cf6',
    },
    {
      title: 'الإيرادات الشهرية',
      value: formatCurrency(stats.monthly_revenue),
      icon: <DollarSign size={20} color="#f59e0b" />,
      iconBg: 'var(--color-amber-dim)',
      trend: stats.revenue_growth_pct,
      trendLabel: 'مقارنة بالشهر الماضي',
      accent: 'var(--color-amber)',
    },
    {
      title: 'ديون العملاء',
      value: formatCurrency(stats.outstanding_customer_debts),
      icon: <CreditCard size={20} color="#f43f5e" />,
      iconBg: 'var(--color-danger-dim)',
      accent: '#f43f5e',
      subtitle: 'إجمالي الأرصدة المتأخرة',
    },
    {
      title: 'مستحقات الموردين',
      value: formatCurrency(stats.supplier_balances),
      icon: <Package size={20} color="#f97316" />,
      iconBg: 'rgba(249,115,22,0.15)',
      accent: '#f97316',
      subtitle: 'إجمالي الديون للموردين',
    },
    {
      title: 'إجمالي العملاء',
      value: formatNumber(stats.customer_growth_pct), // Reused this field for total count
      icon: <Users size={20} color="#06b6d4" />,
      iconBg: 'var(--color-cyan-dim)',
      accent: '#06b6d4',
      subtitle: 'العملاء المسجلين بالنظام',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* KPIs Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
        {kpiCards.map((card, i) => (
          <motion.div key={card.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <KpiCard {...card} />
          </motion.div>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Main Charts area */}
        <div className="dashboard-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h2 className="chart-title">مبيعات آخر 7 أيام</h2>
              <DailySalesChart data={mockDailySalesData} />
            </div>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h2 className="chart-title">الأرباح الشهرية</h2>
              <MonthlyProfitChart data={mockMonthlyProfitData} />
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="chart-title" style={{ margin: 0 }}>أحدث الطلبات</h2>
              <Link href="/orders" className="btn-ghost" style={{ fontSize: '0.85rem' }}>عرض الكل</Link>
            </div>
            <div className="table-container">
              {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center' }}>جاري التحميل...</div>
              ) : (
                <table className="data-table">
                  <thead><tr><th>الطلب</th><th>العميل</th><th>الحالة</th><th>التاريخ</th></tr></thead>
                  <tbody>
                    {recentOrders.map((o) => (
                      <tr key={o.id}>
                        <td style={{ fontFamily: 'monospace', color: 'var(--color-amber)' }}>{o.order_number}</td>
                        <td style={{ fontWeight: 600 }}>{o.customer?.cafe_name}</td>
                        <td>
                          <span className="badge" style={{ background: `${getOrderStatusColor(o.status)}22`, color: getOrderStatusColor(o.status) }}>
                            {getOrderStatusLabel(o.status)}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{formatDateTime(o.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar area */}
        <div className="dashboard-side" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Alerts / Low Stock */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--color-danger)' }}>
              <AlertTriangle size={18} />
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>تنبيهات المخزون</h2>
            </div>
            {loading ? <div style={{ textAlign: 'center' }}>جاري التحميل...</div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {lowStockItems.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>المخزون بوضع ممتاز</p>
                ) : (
                  lowStockItems.map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-surface-2)', padding: '0.75rem', borderRadius: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-danger)' }} />
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{getCharcoalTypeLabel(item.charcoal_type)}</span>
                      </div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-danger)', fontWeight: 700 }}>
                        {item.warehouse_stock} / {item.minimum_stock}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h2 className="chart-title">التدفق النقدي</h2>
            <CashFlowChart data={mockCashFlowData} />
          </div>

          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h2 className="chart-title">أنواع الفحم الأكثر مبيعاً</h2>
            <div style={{ height: 220 }}>
              <CharcoalTypesPieChart data={mockCharcoalSales} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
