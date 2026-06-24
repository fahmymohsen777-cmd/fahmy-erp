'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CreditCard, CheckCircle, Clock, DollarSign, X, TrendingUp } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/store/authStore';

export default function CollectionsPage() {
  const { role } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [customerBalances, setCustomerBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const supabase = createClient();

  const fetchData = async () => {
    try {
      // Fetch Payments
      const { data: payData, error: payError } = await supabase
        .from('payments')
        .select('*, customer:customers(cafe_name, owner_name)')
        .order('payment_date', { ascending: false });
      if (payError) throw payError;
      setPayments(payData || []);

      // Fetch Customer Balances (from the view)
      const { data: balData, error: balError } = await supabase
        .from('customer_balances')
        .select('*')
        .order('outstanding_balance', { ascending: false });
      if (balError) throw balError;
      setCustomerBalances(balData || []);

    } catch (error: any) {
      toast.error('حدث خطأ أثناء جلب المدفوعات');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalOutstanding = customerBalances.reduce((sum, c) => sum + Number(c.outstanding_balance), 0);

  const handleOpenAddModal = (customerId?: string) => {
    setSelectedCustomerId(customerId || null);
    setShowAddModal(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'إجمالي التحصيل', value: formatCurrency(totalCollected), icon: <TrendingUp size={18} color="#10b981" />, bg: 'var(--color-success-dim)' },
          { label: 'عمليات تحصيل', value: String(payments.length), icon: <CheckCircle size={18} color="#f59e0b" />, bg: 'var(--color-amber-dim)' },
          { label: 'إجمالي المتبقي', value: formatCurrency(totalOutstanding), icon: <Clock size={18} color="#f43f5e" />, bg: 'var(--color-danger-dim)' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card" style={{ padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{stat.icon}</div>
            <div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{stat.value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>العملاء المطالبين بالسداد</h2>
        {role === 'admin' && (
          <button className="btn-primary" onClick={() => handleOpenAddModal()}>
            <Plus size={16} /> تسجيل دفعة جديدة
          </button>
        )}
      </div>

      {/* Customers with Debt */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--color-amber)' }}></div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
          {customerBalances.filter(c => Number(c.outstanding_balance) > 0).map((customer, i) => (
            <motion.div key={customer.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{customer.cafe_name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{customer.owner_name}</div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-danger)' }}>{formatCurrency(Number(customer.outstanding_balance))}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 1 }}>متبقي</div>
                </div>
              </div>
              <div className="progress-bar" style={{ marginBottom: '0.75rem' }}>
                <div className="progress-fill" style={{
                  width: `${Math.min((Number(customer.total_payments) / (Number(customer.total_purchases) || 1)) * 100, 100)}%`,
                  background: 'linear-gradient(90deg, var(--color-success), #34d399)',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                <span>مدفوع: {formatCurrency(Number(customer.total_payments))}</span>
                <span>الكل: {formatCurrency(Number(customer.total_purchases))}</span>
              </div>
              {role === 'admin' && (
                <button className="btn-primary" style={{ width: '100%', fontSize: '0.82rem', padding: '0.5rem' }} onClick={() => handleOpenAddModal(customer.id)}>
                  <Plus size={14} /> سداد دفعة
                </button>
              )}
            </motion.div>
          ))}
          {customerBalances.filter(c => Number(c.outstanding_balance) > 0).length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <CheckCircle size={40} style={{ color: 'var(--color-success)' }} />
              <p style={{ color: 'var(--text-muted)' }}>لا توجد ديون مستحقة على العملاء</p>
            </div>
          )}
        </div>
      )}

      {/* Payments Table */}
      {!loading && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>سجل آخر المدفوعات</h2>
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>العميل</th><th>المبلغ</th><th>نوع الدفع</th><th>التاريخ</th><th>ملاحظات</th></tr></thead>
              <tbody>
                {payments.map((payment, i) => (
                  <motion.tr key={payment.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                    <td style={{ fontWeight: 600 }}>{payment.customer?.cafe_name}</td>
                    <td style={{ color: 'var(--color-success)', fontWeight: 700 }}>+{formatCurrency(payment.amount)}</td>
                    <td>
                      <span className="badge" style={{ background: payment.payment_type === 'full' ? 'var(--color-success-dim)' : 'var(--color-amber-dim)', color: payment.payment_type === 'full' ? 'var(--color-success)' : 'var(--color-amber)' }}>
                        {payment.payment_type === 'full' ? 'كامل' : payment.payment_type === 'partial' ? 'جزئي' : 'تقسيط'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{formatDate(payment.payment_date)}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{payment.notes || '—'}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {payments.length === 0 && (
              <div className="empty-state">
                <DollarSign size={40} style={{ color: 'var(--text-muted)' }} />
                <p style={{ color: 'var(--text-muted)' }}>لا توجد مدفوعات مسجلة</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddPaymentModal 
            customerBalances={customerBalances} 
            defaultCustomerId={selectedCustomerId}
            onClose={() => setShowAddModal(false)} 
            onAdd={fetchData} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AddPaymentModal({ customerBalances, defaultCustomerId, onClose, onAdd }: { customerBalances: any[], defaultCustomerId: string | null, onClose: () => void, onAdd: () => void }) {
  const [loading, setLoading] = useState(false);
  const [paymentType, setPaymentType] = useState<'full' | 'partial' | 'installment'>('full');
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const customer_id = formData.get('customer_id') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const notes = formData.get('notes') as string || null;

    if (!customer_id || !amount) {
      toast.error('يرجى تعبئة الحقول المطلوبة');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.from('payments').insert({
        customer_id,
        amount,
        payment_type: paymentType,
        notes,
      });

      if (error) throw error;
      
      toast.success('تم تسجيل الدفعة بنجاح');
      onAdd();
      onClose();
    } catch (error: any) {
      toast.error('حدث خطأ أثناء تسجيل الدفعة');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-card"
        style={{ width: '100%', maxWidth: 450, padding: '1.5rem' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>تسجيل دفعة تحصيل</h2>
          <button className="btn-ghost" style={{ padding: '0.4rem' }} onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="label">العميل *</label>
            <select name="customer_id" className="input-field" required defaultValue={defaultCustomerId || ''}>
              <option value="">اختر عميل...</option>
              {customerBalances.map(c => (
                <option key={c.id} value={c.id}>{c.cafe_name} (متبقي: {formatCurrency(Number(c.outstanding_balance))})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">المبلغ (جنيه) *</label>
            <input name="amount" className="input-field" type="number" step="0.01" placeholder="0" required />
          </div>
          <div>
            <label className="label">نوع الدفع</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(['full', 'partial', 'installment'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPaymentType(t)}
                  className={paymentType === t ? 'btn-primary' : 'btn-secondary'}
                  style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }}
                >
                  {t === 'full' ? 'كامل' : t === 'partial' ? 'جزئي' : 'تقسيط'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">ملاحظات</label>
            <textarea name="notes" className="input-field" rows={2} placeholder="مثال: تحويل فودافون كاش..." style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>إلغاء</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              <DollarSign size={16} /> {loading ? 'جاري الحفظ...' : 'تأكيد الدفع'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
