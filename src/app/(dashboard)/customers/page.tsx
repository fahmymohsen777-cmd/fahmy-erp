'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Phone, MessageCircle, MapPin, Eye, TrendingUp, AlertCircle, X, Trash2 } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import Link from 'next/link';
import { Customer } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { exportToExcel, printToPDF } from '@/lib/exportUtils';
import { FileText, FileDown } from 'lucide-react';
import { useAuth } from '@/lib/store/authStore';

export default function CustomersPage() {
  const { role } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'with_debt' | 'no_debt'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const supabase = createClient();

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_balances')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      toast.error('حدث خطأ أثناء جلب العملاء');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filtered = customers.filter(c => {
    const matchSearch = c.cafe_name.includes(search) || c.owner_name.includes(search) || c.phone.includes(search);
    const matchFilter = filter === 'all' ? true : filter === 'with_debt' ? (c.outstanding_balance ?? 0) > 0 : (c.outstanding_balance ?? 0) === 0;
    return matchSearch && matchFilter;
  });

  const totalDebt = customers.reduce((sum, c) => sum + (c.outstanding_balance ?? 0), 0);
  const totalPurchases = customers.reduce((sum, c) => sum + (c.total_purchases ?? 0), 0);

  const handleExportExcel = () => {
    const data = filtered.map(c => ({
      'الاسم': c.cafe_name,
      'المالك': c.owner_name,
      'الهاتف': c.phone,
      'العنوان': c.address,
      'إجمالي المشتريات': c.total_purchases || 0,
      'المدفوع': c.total_payments || 0,
      'الدين': c.outstanding_balance || 0
    }));
    exportToExcel(data, 'customers_report');
  };

  const handlePrintPDF = () => {
    printToPDF('تقرير العملاء والديون', [
      { header: 'اسم الكافيه/المحل', key: 'cafe_name' },
      { header: 'اسم المالك', key: 'owner_name' },
      { header: 'الهاتف', key: 'phone' },
      { header: 'إجمالي المشتريات', key: 'total_purchases', format: 'currency' },
      { header: 'إجمالي الديون (المتبقي)', key: 'outstanding_balance', format: 'currency' },
    ], filtered);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'إجمالي العملاء', value: formatNumber(customers.length), icon: <TrendingUp size={18} color="#f59e0b" />, bg: 'var(--color-amber-dim)' },
          { label: 'إجمالي المشتريات', value: formatCurrency(totalPurchases), icon: <TrendingUp size={18} color="#10b981" />, bg: 'var(--color-success-dim)' },
          { label: 'إجمالي الديون', value: formatCurrency(totalDebt), icon: <AlertCircle size={18} color="#f43f5e" />, bg: 'var(--color-danger-dim)' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card" style={{ padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{stat.icon}</div>
            <div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{stat.value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input-field"
            style={{ paddingRight: 40 }}
            placeholder="ابحث بالاسم، الهاتف..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['all', 'with_debt', 'no_debt'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={filter === f ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
            >
              {f === 'all' ? 'الكل' : f === 'with_debt' ? 'عليهم دين' : 'صفر دين'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-secondary" style={{ fontSize: '0.82rem', padding: '0.5rem' }} onClick={handlePrintPDF}>
            <FileText size={15} /> طباعة
          </button>
          <button className="btn-secondary" style={{ fontSize: '0.82rem', padding: '0.5rem' }} onClick={handleExportExcel}>
            <FileDown size={15} /> Excel
          </button>
        </div>
        {role === 'admin' && (
          <button className="btn-primary" style={{ whiteSpace: 'nowrap' }} onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> عميل جديد
          </button>
        )}
      </div>

      {/* Customer Cards */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--color-amber)' }}></div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {filtered.map((customer, i) => (
            <CustomerCard key={customer.id} customer={customer} index={i} onDelete={fetchCustomers} />
          ))}
          {filtered.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <Search size={40} style={{ color: 'var(--text-muted)' }} />
              <p style={{ color: 'var(--text-muted)' }}>لا يوجد عملاء مطابقون للبحث</p>
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddCustomerModal onClose={() => setShowAddModal(false)} onAdd={fetchCustomers} />
        )}
      </AnimatePresence>
    </div>
  );
}

function CustomerCard({ customer, index, onDelete }: { customer: Customer; index: number, onDelete: () => void }) {
  const hasDebt = (customer.outstanding_balance ?? 0) > 0;
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = createClient();

  const handleDelete = async () => {
    if (!confirm(`هل أنت متأكد من حذف العميل "${customer.cafe_name}"؟`)) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('customers').delete().eq('id', customer.id);
      if (error) throw error;
      toast.success('تم حذف العميل بنجاح');
      onDelete();
    } catch (error: any) {
      toast.error('حدث خطأ أثناء الحذف');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="glass-card"
      style={{ padding: '1.25rem', opacity: isDeleting ? 0.5 : 1 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 700 }}>{customer.cafe_name}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 2 }}>{customer.owner_name}</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {hasDebt ? (
            <span className="badge badge-danger">
              <AlertCircle size={11} /> متأخر
            </span>
          ) : (
            <span className="badge badge-success">سداد كامل</span>
          )}
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}
            title="حذف العميل"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Address */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
        <MapPin size={13} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{customer.address}</span>
      </div>

      {/* Financials */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
        <div style={{ background: 'var(--color-surface-2)', borderRadius: 10, padding: '0.625rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{formatCurrency(customer.total_purchases ?? 0)}</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>إجمالي</div>
        </div>
        <div style={{ background: 'var(--color-surface-2)', borderRadius: 10, padding: '0.625rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-success)' }}>{formatCurrency(customer.total_payments ?? 0)}</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>مدفوع</div>
        </div>
        <div style={{ background: hasDebt ? 'var(--color-danger-dim)' : 'var(--color-surface-2)', borderRadius: 10, padding: '0.625rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: hasDebt ? 'var(--color-danger)' : 'var(--text-primary)' }}>{formatCurrency(customer.outstanding_balance ?? 0)}</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>متبقي</div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <a href={`tel:${customer.phone}`} className="btn-secondary" style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }}>
          <Phone size={14} /> اتصال
        </a>
        <a href={`https://wa.me/2${customer.whatsapp || customer.phone}`} target="_blank" rel="noopener" className="btn-secondary" style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem', color: '#25d366' }}>
          <MessageCircle size={14} /> واتساب
        </a>
        <Link href={`/customers/${customer.id}`} className="btn-primary" style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }}>
          <Eye size={14} /> ملف
        </Link>
      </div>
    </motion.div>
  );
}

function AddCustomerModal({ onClose, onAdd }: { onClose: () => void, onAdd: () => void }) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const newCustomer = {
      cafe_name: formData.get('cafe_name') as string,
      owner_name: formData.get('owner_name') as string,
      phone: formData.get('phone') as string,
      whatsapp: formData.get('whatsapp') as string || null,
      address: formData.get('address') as string,
      maps_link: formData.get('google_maps_link') as string || null,
      monthly_consumption: parseInt(formData.get('monthly_consumption') as string) || 0,
      notes: formData.get('notes') as string || null,
    };

    try {
      const { error } = await supabase.from('customers').insert(newCustomer);
      if (error) throw error;
      
      toast.success('تمت إضافة العميل بنجاح');
      onAdd();
      onClose();
    } catch (error: any) {
      toast.error('حدث خطأ أثناء الإضافة. تأكد من صحة البيانات.');
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
        style={{ width: '100%', maxWidth: 540, padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>إضافة عميل جديد</h2>
          <button className="btn-ghost" style={{ padding: '0.4rem' }} onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="label">اسم الكافيه / المحل *</label>
              <input name="cafe_name" className="input-field" required placeholder="مثال: كافيه النيل" />
            </div>
            <div>
              <label className="label">اسم المالك *</label>
              <input name="owner_name" className="input-field" required placeholder="اسم الشخص المسؤول" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="label">رقم الهاتف *</label>
              <input name="phone" className="input-field" required placeholder="01xxxxxxxxx" />
            </div>
            <div>
              <label className="label">رقم الواتساب</label>
              <input name="whatsapp" className="input-field" placeholder="اختياري إذا كان مختلفاً" />
            </div>
          </div>

          <div>
            <label className="label">العنوان التفصيلي *</label>
            <input name="address" className="input-field" required placeholder="المنطقة، الشارع، أقرب علامة مميزة" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="label">رابط خرائط جوجل</label>
              <input name="google_maps_link" className="input-field" placeholder="https://maps.google.com/..." dir="ltr" />
            </div>
            <div>
              <label className="label">الاستهلاك الشهري (شيكارة)</label>
              <input name="monthly_consumption" type="number" className="input-field" placeholder="الكمية المتوقعة" />
            </div>
          </div>

          <div>
            <label className="label">ملاحظات</label>
            <textarea name="notes" className="input-field" rows={2} placeholder="أية تفاصيل إضافية عن العميل..." style={{ resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>إلغاء</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'جاري الحفظ...' : 'حفظ العميل'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
