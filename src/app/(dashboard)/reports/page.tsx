'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileDown, FileText, Calendar, TrendingUp, DollarSign, Package, Truck, CheckCircle, TrendingDown } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { exportToExcel, printToPDF } from '@/lib/exportUtils';

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'custom';

export default function ReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>('monthly');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [reportData, setReportData] = useState({
    revenue: 0,
    profit: 0,
    costOfGoods: 0,
    expenses: 0,
    supplierPayments: 0,
    supplierDebt: 0,
    ordersCount: 0,
    deliveriesCount: 0,
    collections: 0,
  });

  const supabase = createClient();

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      try {
        const now = new Date();
        let startStr = '';
        let endStr = '';
        
        if (period === 'daily') {
          startStr = now.toISOString().slice(0, 10);
          endStr = startStr;
        } else if (period === 'weekly') {
          const pastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          startStr = pastWeek.toISOString().slice(0, 10);
          endStr = now.toISOString().slice(0, 10);
        } else if (period === 'monthly') {
          const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
          startStr = firstDay.toISOString().slice(0, 10);
          endStr = now.toISOString().slice(0, 10);
        } else if (period === 'custom') {
          startStr = customStart;
          endStr = customEnd;
          
          // If only one date is provided, bound the search to that specific day
          if (startStr && !endStr) endStr = startStr;
          if (!startStr && endStr) startStr = endStr;
        }

        // Fetch Orders and Items
        let ordersQuery = supabase.from('orders').select('*, items:order_items(total_price, quantity)');
        if (startStr) ordersQuery = ordersQuery.gte('created_at', startStr);
        if (endStr) ordersQuery = ordersQuery.lte('created_at', endStr + 'T23:59:59');
        const { data: orders } = await ordersQuery;
        
        // Fetch Payments
        let paymentsQuery = supabase.from('payments').select('*');
        if (startStr) paymentsQuery = paymentsQuery.gte('payment_date', startStr);
        if (endStr) paymentsQuery = paymentsQuery.lte('payment_date', endStr + 'T23:59:59');
        const { data: payments } = await paymentsQuery;

        // Fetch Expenses
        let expQuery = supabase.from('expenses').select('*');
        if (startStr) expQuery = expQuery.gte('expense_date', startStr);
        if (endStr) expQuery = expQuery.lte('expense_date', endStr + 'T23:59:59');
        const { data: expenses } = await expQuery;

        // Fetch Supplier Payments
        let supPayQuery = supabase.from('supplier_payments').select('*');
        if (startStr) supPayQuery = supPayQuery.gte('payment_date', startStr);
        if (endStr) supPayQuery = supPayQuery.lte('payment_date', endStr + 'T23:59:59');
        const { data: supPayments } = await supPayQuery;

        // Fetch Supplier Debt
        const { data: supBalances } = await supabase
          .from('supplier_balances')
          .select('outstanding_balance');

        // Fetch Real Avg Cost from incoming inventory shipments (DISABLED based on user request)
        // We will set cost to 0 so it doesn't affect Net Profit
        const avgBagCost = 0;

        // Calculate
        let totalRevenue = 0;
        let totalBagsSold = 0;
        let deliveriesCount = 0;

        (orders || []).forEach(o => {
          if (o.status === 'delivered' || o.status === 'collected') {
            deliveriesCount++;
          }
          o.items?.forEach((i: any) => {
            totalRevenue += Number(i.total_price);
            totalBagsSold += Number(i.quantity);
          });
        });

        const totalCostOfGoods = totalBagsSold * avgBagCost;
        const totalExpenses = (expenses || []).reduce((sum, e) => sum + Number(e.amount), 0);
        const totalSupplierPayments = (supPayments || []).reduce((sum, p) => sum + Number(p.amount), 0);
        const totalSupplierDebt = (supBalances || []).reduce((sum, s) => sum + Number(s.outstanding_balance), 0);
        const totalCollections = (payments || []).reduce((sum, p) => sum + Number(p.amount), 0);

        const netProfit = totalRevenue - totalCostOfGoods - totalExpenses - totalSupplierPayments - totalSupplierDebt;

        setReportData({
          revenue: totalRevenue,
          profit: netProfit,
          costOfGoods: totalCostOfGoods,
          expenses: totalExpenses,
          supplierPayments: totalSupplierPayments,
          supplierDebt: totalSupplierDebt,
          ordersCount: orders?.length || 0,
          deliveriesCount,
          collections: totalCollections,
        });

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [period, customStart, customEnd]);

  const getPeriodLabel = () => {
    if (period === 'daily') return 'يومية';
    if (period === 'weekly') return 'أسبوعية';
    if (period === 'monthly') return 'شهرية';
    return `مخصصة (${customStart} - ${customEnd})`;
  };

  const handleExportExcel = () => {
    const data = [{
      'الفترة': getPeriodLabel(),
      'إجمالي المبيعات (الإيرادات)': reportData.revenue,
      'تكلفة البضاعة المباعة': reportData.costOfGoods,
      'المصروفات النثرية': reportData.expenses,
      'مدفوعات الموردين': reportData.supplierPayments,
      'ديون الموردين (المستحقة)': reportData.supplierDebt,
      'التحصيل النقدي': reportData.collections,
      'عدد الطلبات': reportData.ordersCount,
      'صافي الربح الفعلي': reportData.profit,
    }];
    exportToExcel(data, `profit_report_${period}`);
  };

  const handlePrintPDF = () => {
    const data = [{
      periodStr: getPeriodLabel(),
      revenue: reportData.revenue,
      cogs: reportData.costOfGoods,
      expenses: reportData.expenses,
      supplierPay: reportData.supplierPayments,
      supplierDebt: reportData.supplierDebt,
      collections: reportData.collections,
      orders: reportData.ordersCount,
      profit: reportData.profit,
    }];
    printToPDF(`تقرير الأرباح`, [
      { header: 'الفترة', key: 'periodStr' },
      { header: 'المبيعات', key: 'revenue', format: 'currency' },
      { header: 'المصروفات', key: 'expenses', format: 'currency' },
      { header: 'مدفوعات الموردين', key: 'supplierPay', format: 'currency' },
      { header: 'ديون الموردين', key: 'supplierDebt', format: 'currency' },
      { header: 'التحصيلات', key: 'collections', format: 'currency' },
      { header: 'الطلبات', key: 'orders' },
      { header: 'صافي الربح', key: 'profit', format: 'currency' },
    ], data);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Period Selector */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {[{ v: 'daily', l: 'يومية' }, { v: 'weekly', l: 'أسبوعية' }, { v: 'monthly', l: 'شهرية' }].map(p => (
          <button 
            key={p.v} 
            onClick={() => { setPeriod(p.v as ReportPeriod); setCustomStart(''); setCustomEnd(''); }} 
            className={period === p.v ? 'btn-primary' : 'btn-secondary'} 
            style={{ minWidth: 90 }}
          >
            {p.l}
          </button>
        ))}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-surface-2)', padding: '0.2rem 0.5rem', borderRadius: 8 }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>من</span>
          <input type="date" className="input-field" style={{ padding: '0.4rem', fontSize: '0.82rem', width: 120 }} value={customStart} onChange={e => { setCustomStart(e.target.value); setPeriod('custom'); }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>إلى</span>
          <input type="date" className="input-field" style={{ padding: '0.4rem', fontSize: '0.82rem', width: 120 }} value={customEnd} onChange={e => { setCustomEnd(e.target.value); setPeriod('custom'); }} />
        </div>

        <div style={{ marginRight: 'auto', display: 'flex', gap: '0.5rem' }}>
          <button className="btn-secondary" style={{ fontSize: '0.82rem' }} onClick={handlePrintPDF}><FileText size={15} /> تصدير PDF</button>
          <button className="btn-secondary" style={{ fontSize: '0.82rem' }} onClick={handleExportExcel}><FileDown size={15} /> تصدير Excel</button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center' }}>جاري حساب الأرباح والتقارير...</div>
      ) : (
        <>
          {/* Report Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {[
              { label: 'إجمالي المبيعات (الإيرادات)', value: formatCurrency(reportData.revenue), icon: <DollarSign size={20} color="#f59e0b" />, bg: 'var(--color-amber-dim)', color: 'var(--color-amber)' },
              { label: 'التحصيل النقدي', value: formatCurrency(reportData.collections), icon: <CheckCircle size={20} color="#f97316" />, bg: 'rgba(249,115,22,0.15)', color: '#f97316' },
              { label: 'الطلبات', value: formatNumber(reportData.ordersCount), icon: <Package size={20} color="#3b82f6" />, bg: 'var(--color-info-dim)', color: '#3b82f6' },
              { label: 'التوصيلات المنجزة', value: formatNumber(reportData.deliveriesCount), icon: <Truck size={20} color="#8b5cf6" />, bg: 'var(--color-purple-dim)', color: '#8b5cf6' },
              { label: reportData.profit < 0 ? 'إجمالي الخسارة' : 'صافي الربح الحقيقي', value: (reportData.profit < 0 ? '-' : '') + formatCurrency(Math.abs(reportData.profit)), icon: reportData.profit < 0 ? <TrendingDown size={20} color="#f43f5e" /> : <TrendingUp size={20} color="#10b981" />, bg: reportData.profit < 0 ? 'var(--color-danger-dim)' : 'var(--color-success-dim)', color: reportData.profit < 0 ? 'var(--color-danger)' : 'var(--color-success)' },
            ].map((card, i) => (
              <motion.div key={card.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="glass-card" style={{ padding: '1.25rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>{card.icon}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: card.color }}>{card.value}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{card.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Profit Calculator */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem' }}>حساب صافي الربح الفعلي للفترة ({getPeriodLabel()})</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--color-surface-2)', borderRadius: 12 }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>إجمالي المبيعات (الإيرادات)</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-amber)' }}>{formatCurrency(reportData.revenue)}</span>
              </div>
              
              <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid rgba(244,63,94,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', marginBottom: '1rem' }}><TrendingDown size={18} color="#f43f5e" /> الاستقطاعات والمصروفات</div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--color-surface-2)', borderRadius: 12, marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>إجمالي المصروفات (إيجار، عمالة، نقل...)</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-danger)' }}>- {formatCurrency(reportData.expenses)}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--color-surface-2)', borderRadius: 12, marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>مدفوعات ومسددات الموردين (كاش)</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-danger)' }}>- {formatCurrency(reportData.supplierPayments)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--color-surface-2)', borderRadius: 12 }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>الديون المستحقة للموردين (آجل)</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-danger)' }}>- {formatCurrency(reportData.supplierDebt)}</span>
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: '1.5rem', padding: '1.5rem', borderRadius: 12, background: reportData.profit < 0 ? 'var(--color-danger-dim)' : 'var(--color-success-dim)', border: `1px solid ${reportData.profit < 0 ? 'rgba(244,63,94,0.3)' : 'rgba(16,185,129,0.3)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: reportData.profit < 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>{reportData.profit < 0 ? 'إجمالي الخسارة للفترة' : 'صافي الربح الفعلي'}</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: reportData.profit < 0 ? 'var(--color-danger)' : 'var(--color-success)', direction: 'ltr' }}>
                  {reportData.profit < 0 ? '-' : ''}{formatCurrency(Math.abs(reportData.profit))}
                </div>
                {reportData.revenue > 0 && (
                  <div style={{ fontSize: '0.9rem', color: reportData.profit < 0 ? 'var(--color-danger)' : 'var(--color-success)', opacity: 0.8 }}>
                    هامش {reportData.profit < 0 ? 'الخسارة' : 'الربح'}: {((Math.abs(reportData.profit) / reportData.revenue) * 100).toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
