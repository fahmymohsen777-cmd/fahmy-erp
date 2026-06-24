'use client';
import { use, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MapPin, Package, CreditCard, ArrowRight, Plus, TrendingDown, CheckCircle, Clock, Truck, X, FileText, FileDown, DollarSign } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { exportToExcel, printToPDF } from '@/lib/exportUtils';
import { useAuth } from '@/lib/store/authStore';

export default function SupplierProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { role } = useAuth();
  
  const [supplier, setSupplier] = useState<any>(null);
  const [balance, setBalance] = useState<any>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const supabase = createClient();

  const fetchSupplierData = async () => {
    try {
      setLoading(true);
      const { data: suppData, error: suppErr } = await supabase.from('suppliers').select('*').eq('id', id).single();
      if (suppErr) throw suppErr;
      setSupplier(suppData);

      const { data: balData } = await supabase.from('supplier_balances').select('*').eq('id', id).single();
      setBalance(balData || { outstanding_balance: 0, total_purchases: 0, total_payments: 0 });

      const { data: movData } = await supabase.from('inventory_movements').select('*').eq('supplier_id', id).eq('movement_type', 'in').order('created_at', { ascending: false });
      setMovements(movData || []);

      const { data: payData } = await supabase.from('supplier_payments').select('*').eq('supplier_id', id).order('payment_date', { ascending: false });
      setPayments(payData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplierData();
  }, [id]);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>جاري تحميل بيانات المورد...</div>;
  if (!supplier) return <div style={{ padding: '3rem', textAlign: 'center' }}>المورد غير موجود</div>;

  const hasDebt = Number(balance?.outstanding_balance) > 0;

  // Timeline: merge orders and payments, newest first
  const timeline = [
    ...movements.map(m => ({ type: 'order' as const, date: m.created_at, data: m })),
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
        'النوع': isOrder ? 'طلبية واردة' : 'تسديد دفعة',
        'التاريخ': formatDate(item.date),
        'التفاصيل': isOrder ? `الكمية: ${item.data.quantity} شيكارة` : `ملاحظات: ${item.data.notes || 'لا يوجد'}`,
        'المبلغ': isOrder ? item.data.total_price : item.data.amount
      };
    });
    exportToExcel(data, `supplier_ledger_${supplier.name}`);
  };

  const handlePrintPDF = () => {
    const printData = filteredTimeline.map(item => ({
      typeStr: item.type === 'order' ? 'طلبية واردة' : 'تسديد دفعة',
      dateStr: item.date,
      details: item.type === 'order' ? `الكمية: ${item.data.quantity} شيكارة` : `ملاحظات: ${item.data.notes || 'لا يوجد'}`,
      amount: item.type === 'order' ? item.data.total_price : item.data.amount
    }));
    printToPDF(`كشف حساب المورد: ${supplier.name}`, [
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
        <Link href="/suppliers" style={{ color: 'var(--color-amber)', textDecoration: 'none' }}>الموردون</Link>
        <ArrowRight size={14} />
        <span>{supplier.name}</span>
      </div>

      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #f59e0b, #f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800, color: '#000', flexShrink: 0 }}>
            {supplier.name[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{supplier.name}</h1>
              {hasDebt ? <span className="badge badge-danger">لنا دين عليه / له مستحقات</span> : <span className="badge badge-success">خالص</span>}
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.85rem', color: 'var(--text-muted)' }}><Package size={14} /> نوع الفحم: {supplier.charcoal_type}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.85rem', color: 'var(--text-muted)' }}><CreditCard size={14} /> سعر الشيكارة: {formatCurrency(supplier.price_per_bag)}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <a href={`tel:${supplier.phone}`} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}><Phone size={16} /> اتصال</a>
          </div>
        </div>
      </motion.div>

      {/* Financial Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}><Truck size={16} color="var(--color-amber)" /> إجمالي المشتريات (طلبيات)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{formatCurrency(Number(balance?.total_purchases))}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}><CheckCircle size={16} color="var(--color-success)" /> إجمالي المسدد له</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-success)' }}>{formatCurrency(Number(balance?.total_payments))}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card" style={{ padding: '1.25rem', border: hasDebt ? '1px solid rgba(244,63,94,0.3)' : undefined }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}><Clock size={16} color={hasDebt ? "var(--color-danger)" : "var(--text-muted)"} /> المستحق للمورد (الدين)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: hasDebt ? 'var(--color-danger)' : 'var(--text-primary)' }}>
            {formatCurrency(Number(balance?.outstanding_balance))}
          </div>
        </motion.div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginTop: '1rem' }}>
        {/* Timeline */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>سجل التعاملات (طلبيات ومدفوعات)</h2>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input type="date" className="input-field" style={{ padding: '0.4rem', fontSize: '0.82rem', width: 130 }} value={startDate} onChange={e => setStartDate(e.target.value)} />
              <input type="date" className="input-field" style={{ padding: '0.4rem', fontSize: '0.82rem', width: 130 }} value={endDate} onChange={e => setEndDate(e.target.value)} />

              <button onClick={handlePrintPDF} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                <FileText size={14} /> طباعة
              </button>
              <button onClick={handleExportExcel} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                <FileDown size={14} /> Excel
              </button>
              {role === 'admin' && (
                <>
                  <button onClick={() => setShowPaymentModal(true)} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                    <DollarSign size={16} /> سداد دفعة
                  </button>
                  <button onClick={() => setShowOrderModal(true)} className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                    <Plus size={16} /> طلبية جديدة
                  </button>
                </>
              )}
            </div>
          </div>

          <div style={{ position: 'relative', paddingRight: '1rem' }}>
            <div style={{ position: 'absolute', right: '0.5rem', top: 0, bottom: 0, width: 2, background: 'var(--color-surface-3)' }} />
            {filteredTimeline.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem' }}>لا يوجد تعاملات مسجلة حتى الآن</div>}

            {filteredTimeline.map((item, i) => {
              const isOrder = item.type === 'order';
              const data = item.data;
              return (
                <motion.div key={`${item.type}-${data.id}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} style={{ position: 'relative', marginBottom: '1.5rem', paddingRight: '1.5rem' }}>
                  <div style={{ position: 'absolute', right: '-1.15rem', top: '0.25rem', width: 14, height: 14, borderRadius: '50%', background: isOrder ? 'var(--color-amber)' : 'var(--color-success)', border: '3px solid var(--color-surface-1)' }} />
                  <div style={{ background: 'var(--color-surface-2)', borderRadius: 12, padding: '1rem', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {isOrder ? <Truck size={16} color="var(--color-amber)" /> : <CreditCard size={16} color="var(--color-success)" />}
                        <span style={{ fontWeight: 700 }}>{isOrder ? 'طلبية واردة (تخزين)' : 'تسديد دفعة نقدية'}</span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatDate(item.date)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '0.75rem' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {isOrder ? <span>الكمية: {data.quantity} شيكارة | سعر الوحدة: {formatCurrency(data.unit_price)}</span> : <span>ملاحظات: {data.notes || 'لا يوجد'}</span>}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: isOrder ? 'var(--text-primary)' : 'var(--color-success)' }}>
                        {isOrder ? formatCurrency(data.total_price) : `+${formatCurrency(data.amount)}`}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showPaymentModal && <AddSupplierPaymentModal supplier={supplier} onClose={() => setShowPaymentModal(false)} onAdd={fetchSupplierData} />}
        {showOrderModal && <AddSupplierOrderModal supplier={supplier} onClose={() => setShowOrderModal(false)} onAdd={fetchSupplierData} />}
      </AnimatePresence>
    </div>
  );
}

function AddSupplierPaymentModal({ supplier, onClose, onAdd }: any) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      const { error } = await supabase.from('supplier_payments').insert({
        supplier_id: supplier.id,
        amount: parseFloat(formData.get('amount') as string),
        notes: formData.get('notes') as string,
        payment_date: formData.get('payment_date') as string,
      });
      if (error) throw error;
      toast.success('تم تسجيل الدفعة بنجاح');
      onAdd();
      onClose();
    } catch (err) {
      toast.error('حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card" style={{ width: '100%', maxWidth: 400, padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>تسديد دفعة للمورد</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div><label className="label">المبلغ *</label><input name="amount" type="number" step="0.01" className="input-field" required /></div>
          <div><label className="label">التاريخ *</label><input name="payment_date" type="date" className="input-field" defaultValue={new Date().toISOString().split('T')[0]} required /></div>
          <div><label className="label">ملاحظات</label><input name="notes" className="input-field" /></div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>إلغاء</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'جاري الحفظ...' : 'حفظ الدفعة'}</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function AddSupplierOrderModal({ supplier, onClose, onAdd }: any) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const qty = parseInt(formData.get('quantity') as string);
    try {
      // 1. Record incoming inventory movement with cost
      const { error: movErr } = await supabase.from('inventory_movements').insert({
        supplier_id: supplier.id,
        movement_type: 'in',
        charcoal_type: supplier.charcoal_type,
        quantity: qty,
        unit_price: parseFloat(formData.get('unit_price') as string),
        notes: formData.get('notes') as string,
      });
      if (movErr) throw movErr;

      // 2. Update warehouse stock
      const { data: inv } = await supabase.from('inventory').select('warehouse_stock').eq('charcoal_type', supplier.charcoal_type).single();
      if (inv) {
        await supabase.from('inventory').update({ warehouse_stock: Number(inv.warehouse_stock) + qty }).eq('charcoal_type', supplier.charcoal_type);
      }

      toast.success('تم تسجيل الطلبية بنجاح وإضافتها للمخزون');
      onAdd();
      onClose();
    } catch (err) {
      toast.error('حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card" style={{ width: '100%', maxWidth: 400, padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>إضافة طلبية (تخزين وارد)</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div><label className="label">الكمية (شيكارة) *</label><input name="quantity" type="number" className="input-field" required /></div>
          <div><label className="label">سعر الشيكارة *</label><input name="unit_price" type="number" step="0.01" className="input-field" defaultValue={supplier.price_per_bag} required /></div>
          <div><label className="label">ملاحظات</label><input name="notes" className="input-field" /></div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>إلغاء</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'جاري الحفظ...' : 'حفظ الطلبية'}</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
