'use client';
import { use, useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Phone, MessageCircle, MapPin, Package, CreditCard,
  ArrowRight, Plus, TrendingUp, Clock, CheckCircle,
} from 'lucide-react';
import { formatCurrency, formatDate, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { exportToExcel, printToPDF } from '@/lib/exportUtils';
import { FileDown, FileText } from 'lucide-react';

export default function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [customer, setCustomer] = useState<any>(null);
  const [balance, setBalance] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const supabase = createClient();

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const { data: custData, error: custErr } = await supabase.from('customers').select('*').eq('id', id).single();
        if (custErr) throw custErr;
        setCustomer(custData);

        const { data: balData } = await supabase.from('customer_balances').select('*').eq('id', id).single();
        setBalance(balData || { outstanding_balance: 0, total_purchases: 0, total_payments: 0 });

        const { data: ordersData } = await supabase.from('orders').select('*, items:order_items(*)').eq('customer_id', id);
        setOrders(ordersData || []);

        const { data: paymentsData } = await supabase.from('payments').select('*').eq('customer_id', id);
        setPayments(paymentsData || []);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomerData();
  }, [id]);

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center' }}>جاري تحميل بيانات العميل...</div>;
  }

  if (!customer) {
    return <div style={{ padding: '3rem', textAlign: 'center' }}>العميل غير موجود</div>;
  }

  const hasDebt = Number(balance?.outstanding_balance) > 0;

  // Timeline: merge orders and payments, newest first
  const timeline = [
    ...orders.map(o => ({ type: 'order' as const, date: o.created_at, data: o })),
    ...payments.map(p => ({ type: 'payment' as const, date: p.payment_date, data: p })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredTimeline = timeline.filter(item => {
    const itemDate = item.date.split('T')[0];
    if (startDate && itemDate < startDate) return false;
    if (endDate && itemDate > endDate) return false;
    return true;
  });

  const handleExportExcel = () => {
    const data = filteredTimeline.map(item => {
      const isOrder = item.type === 'order';
      return {
        'النوع': isOrder ? 'طلب توصيل' : 'تسديد دفعة',
        'التاريخ': formatDate(item.date),
        'التفاصيل': isOrder ? `الكمية: ${item.data.items?.reduce((s:number, i:any) => s + Number(i.quantity), 0)} شيكارة` : `ملاحظات: ${item.data.notes || 'لا يوجد'}`,
        'المبلغ': isOrder ? item.data.items?.reduce((s:number, i:any) => s + Number(i.total_price), 0) : item.data.amount
      };
    });
    exportToExcel(data, `customer_ledger_${customer.cafe_name}`);
  };

  const handlePrintPDF = () => {
    const printData = filteredTimeline.map(item => ({
      typeStr: item.type === 'order' ? 'طلب توصيل' : 'تسديد دفعة',
      dateStr: item.date,
      details: item.type === 'order' ? `الكمية: ${item.data.items?.reduce((s:number, i:any) => s + Number(i.quantity), 0)} شيكارة` : `ملاحظات: ${item.data.notes || 'لا يوجد'}`,
      amount: item.type === 'order' ? item.data.items?.reduce((s:number, i:any) => s + Number(i.total_price), 0) : item.data.amount
    }));
    printToPDF(`كشف حساب العميل: ${customer.cafe_name}`, [
      { header: 'النوع', key: 'typeStr' },
      { header: 'التاريخ', key: 'dateStr', format: 'date' },
      { header: 'التفاصيل', key: 'details' },
      { header: 'المبلغ', key: 'amount', format: 'currency' },
    ], printData);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <Link href="/customers" style={{ color: 'var(--color-amber)', textDecoration: 'none' }}>
          العملاء
        </Link>
        <ArrowRight size={14} />
        <span>{customer.cafe_name}</span>
      </div>

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
        style={{ padding: '1.5rem' }}
      >
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div
            style={{
              width: 64, height: 64, borderRadius: 16,
              background: 'linear-gradient(135deg, #f59e0b, #f97316)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', fontWeight: 800, color: '#000', flexShrink: 0,
            }}
          >
            {customer.cafe_name[0]}
          </div>

          {/* Info */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{customer.cafe_name}</h1>
              {hasDebt ? (
                <span className="badge badge-danger">عليه دين</span>
              ) : (
                <span className="badge badge-success">سداد كامل</span>
              )}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              {customer.owner_name}
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <MapPin size={14} /> {customer.address}
                <button 
                  onClick={() => {
                    const text = encodeURIComponent(`📍 موقع العميل: ${customer.cafe_name}\nالعنوان: ${customer.address}`);
                    window.open(`https://wa.me/?text=${text}`, '_blank');
                  }}
                  className="btn-ghost" 
                  style={{ padding: '0.2rem', color: '#25D366' }}
                  title="مشاركة الموقع عبر واتساب"
                >
                  <MessageCircle size={14} />
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <Package size={14} /> الاستهلاك المتوقع: {customer.monthly_consumption || 0} شيكارة
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--color-surface-2)', padding: '0.25rem', borderRadius: 8 }}>
              <button 
                onClick={() => {
                  const text = encodeURIComponent(`📄 *بيانات العميل*\n\nالاسم: ${customer.cafe_name}\nالمالك: ${customer.owner_name || 'غير محدد'}\nالعنوان: ${customer.address}\nرقم الهاتف: ${customer.phone || 'غير محدد'}\nالاستهلاك المتوقع: ${customer.monthly_consumption || 0} شيكارة\n\n💰 *الحساب*\nالمشتريات: ${formatCurrency(balance?.total_purchases || 0)}\nالمدفوعات: ${formatCurrency(balance?.total_payments || 0)}\nالرصيد المتبقي: ${formatCurrency(balance?.outstanding_balance || 0)}`);
                  window.open(`https://wa.me/?text=${text}`, '_blank');
                }}
                className="btn-secondary" 
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', color: '#25D366' }}
              >
                <MessageCircle size={14} /> واتساب
              </button>
              <a href={`tel:${customer.phone}`} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                <Phone size={16} /> اتصال
              </a>
              <a href={`https://wa.me/2${customer.whatsapp || customer.phone}`} target="_blank" rel="noopener" className="btn-secondary" style={{ padding: '0.5rem 1rem', color: '#25d366' }}>
                <MessageCircle size={16} /> واتساب
              </a>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Financial Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <TrendingUp size={16} color="var(--color-amber)" /> إجمالي السحوبات
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{formatCurrency(Number(balance?.total_purchases))}</div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <CheckCircle size={16} color="var(--color-success)" /> إجمالي المدفوع
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-success)' }}>{formatCurrency(Number(balance?.total_payments))}</div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card" style={{ padding: '1.25rem', border: hasDebt ? '1px solid rgba(244,63,94,0.3)' : undefined }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <Clock size={16} color={hasDebt ? "var(--color-danger)" : "var(--text-muted)"} /> المتبقي (الدين)
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: hasDebt ? 'var(--color-danger)' : 'var(--text-primary)' }}>
            {formatCurrency(Number(balance?.outstanding_balance))}
          </div>
        </motion.div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginTop: '1rem' }}>
        {/* Timeline */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>سجل التعاملات (كشف حساب)</h2>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input type="date" className="input-field" style={{ padding: '0.5rem', fontSize: '0.82rem', width: 130 }} value={startDate} onChange={e => setStartDate(e.target.value)} />
              <input type="date" className="input-field" style={{ padding: '0.5rem', fontSize: '0.82rem', width: 130 }} value={endDate} onChange={e => setEndDate(e.target.value)} />

              <button onClick={handlePrintPDF} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                <FileText size={14} /> طباعة
              </button>
              <button onClick={handleExportExcel} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                <FileDown size={14} /> Excel
              </button>
              <Link href="/collections" className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                <CreditCard size={14} /> تسجيل دفعة
              </Link>
              <Link href="/orders" className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                <Plus size={14} /> طلب جديد
              </Link>
            </div>
          </div>

          <div style={{ position: 'relative', paddingRight: '1rem' }}>
            {/* Vertical Line */}
            <div style={{ position: 'absolute', right: '0.5rem', top: 0, bottom: 0, width: 2, background: 'var(--color-surface-3)' }} />

            {filteredTimeline.length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem' }}>لا يوجد تعاملات مسجلة حتى الآن</div>
            )}

            {filteredTimeline.map((item, i) => {
              const isOrder = item.type === 'order';
              const orderData = isOrder ? item.data : null;
              const paymentData = !isOrder ? item.data : null;

              return (
                <motion.div
                  key={`${item.type}-${isOrder ? orderData.id : paymentData.id}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{ position: 'relative', marginBottom: '1.5rem', paddingRight: '1.5rem' }}
                >
                  {/* Timeline Dot */}
                  <div
                    style={{
                      position: 'absolute', right: '-1.15rem', top: '0.25rem', width: 14, height: 14, borderRadius: '50%',
                      background: isOrder ? 'var(--color-amber)' : 'var(--color-success)',
                      border: '3px solid var(--color-surface-1)',
                    }}
                  />

                  <div style={{ background: 'var(--color-surface-2)', borderRadius: 12, padding: '1rem', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {isOrder ? <Package size={16} color="var(--color-amber)" /> : <CreditCard size={16} color="var(--color-success)" />}
                        <span style={{ fontWeight: 700 }}>
                          {isOrder ? `طلب توصيل (${orderData.order_number})` : 'دفعة تحصيل'}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {formatDate(item.date)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '0.75rem' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {isOrder ? (
                          <span>
                            الكمية: {orderData.items?.reduce((s:number, i:any) => s + Number(i.quantity), 0)} شيكارة | 
                            حالة الطلب: <span style={{ color: getOrderStatusColor(orderData.status) }}>{getOrderStatusLabel(orderData.status)}</span>
                          </span>
                        ) : (
                          <span>طريقة الدفع: {paymentData.payment_type === 'full' ? 'كامل' : 'جزئي'} {paymentData.notes && `(${paymentData.notes})`}</span>
                        )}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: isOrder ? 'var(--text-primary)' : 'var(--color-success)' }}>
                        {isOrder ? (
                          formatCurrency(orderData.items?.reduce((s:number, i:any) => s + Number(i.total_price), 0))
                        ) : (
                          `+${formatCurrency(paymentData.amount)}`
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
