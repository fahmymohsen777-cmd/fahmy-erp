'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Truck, DollarSign, Phone, TrendingDown, AlertCircle, CheckCircle, X, Trash2 } from 'lucide-react';
import { formatCurrency, getCharcoalTypeLabel, getCharcoalTypeColor } from '@/lib/utils';
import { Supplier } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import { useAuth } from '@/lib/store/authStore';

export default function SuppliersPage() {
  const { role } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const supabase = createClient();

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('supplier_balances')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error: any) {
      toast.error('حدث خطأ أثناء جلب الموردين');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const totalBalance = suppliers.reduce((sum, s) => sum + Number(s.outstanding_balance ?? 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'عدد الموردين', value: String(suppliers.length), icon: <Truck size={18} color="#f59e0b" />, bg: 'var(--color-amber-dim)' },
          { label: 'إجمالي المستحقات', value: formatCurrency(totalBalance), icon: <AlertCircle size={18} color="#f43f5e" />, bg: 'var(--color-danger-dim)' },
          { label: 'موردون بدون دين', value: String(suppliers.filter(s => Number(s.outstanding_balance) === 0).length), icon: <CheckCircle size={18} color="#10b981" />, bg: 'var(--color-success-dim)' },
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
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {role === 'admin' && (
          <button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={16} /> إضافة مورد</button>
        )}
      </div>

      {/* Supplier Cards */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--color-amber)' }}></div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
          {suppliers.map((supplier, i) => (
             <SupplierCard key={supplier.id} supplier={supplier} index={i} onDelete={fetchSuppliers} />
          ))}
          {suppliers.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <Truck size={40} style={{ color: 'var(--text-muted)' }} />
              <p style={{ color: 'var(--text-muted)' }}>لا يوجد موردين</p>
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && <AddSupplierModal onClose={() => setShowAdd(false)} onAdd={fetchSuppliers} />}
      </AnimatePresence>
    </div>
  );
}

function SupplierCard({ supplier, index, onDelete }: { supplier: Supplier, index: number, onDelete: () => void }) {
  const typeColor = getCharcoalTypeColor(supplier.charcoal_type);
  const hasDebt = Number(supplier.outstanding_balance) > 0;
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = createClient();

  const handleDelete = async () => {
    if (!confirm(`هل أنت متأكد من حذف المورد "${supplier.name}"؟`)) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('suppliers').delete().eq('id', supplier.id);
      if (error) throw error;
      toast.success('تم حذف المورد بنجاح');
      onDelete();
    } catch (error: any) {
      toast.error('حدث خطأ أثناء الحذف');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }} className="glass-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden', opacity: isDeleting ? 0.5 : 1 }}>
      {/* Color Accent */}
      <div style={{ position: 'absolute', top: 0, right: 0, left: 0, height: 3, background: `linear-gradient(90deg, transparent, ${typeColor}, transparent)` }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>{supplier.name}</div>
          {supplier.phone && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={12} />{supplier.phone}</div>}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ background: `${typeColor}22`, color: typeColor, border: `1px solid ${typeColor}44`, borderRadius: 20, padding: '3px 10px', fontSize: '0.78rem', fontWeight: 600 }}>
            {getCharcoalTypeLabel(supplier.charcoal_type)}
          </span>
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}
            title="حذف المورد"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Pricing */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
        {[
          { label: 'سعر الكيلو', value: formatCurrency(supplier.price_per_kg) },
          { label: 'سعر الشيكارة', value: formatCurrency(supplier.price_per_bag) },
          { label: 'تكلفة توصيل', value: formatCurrency(supplier.delivery_cost) },
        ].map(item => (
          <div key={item.label} style={{ background: 'var(--color-surface-2)', borderRadius: 10, padding: '0.625rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>{item.value}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Balance */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: 10, background: hasDebt ? 'var(--color-danger-dim)' : 'var(--color-success-dim)', border: `1px solid ${hasDebt ? 'rgba(244,63,94,0.3)' : 'rgba(16,185,129,0.3)'}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {hasDebt ? <TrendingDown size={15} color="var(--color-danger)" /> : <CheckCircle size={15} color="var(--color-success)" />}
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>الرصيد المستحق</span>
        </div>
        <span style={{ fontSize: '1.05rem', fontWeight: 800, color: hasDebt ? 'var(--color-danger)' : 'var(--color-success)' }}>{formatCurrency(supplier.outstanding_balance)}</span>
      </div>

      {supplier.notes && <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{supplier.notes}</div>}
      
      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'center' }}>
        <Link href={`/suppliers/${supplier.id}`} className="btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
          <Eye size={16} /> فتح ملف المورد (تسجيل الطلبيات والدفعات)
        </Link>
      </div>
    </motion.div>
  );
}

function AddSupplierModal({ onClose, onAdd }: { onClose: () => void, onAdd: () => void }) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const newSupplier = {
      name: formData.get('name') as string,
      charcoal_type: formData.get('charcoal_type') as string,
      price_per_kg: parseFloat(formData.get('price_per_kg') as string),
      price_per_bag: parseFloat(formData.get('price_per_bag') as string),
      bag_weight_kg: parseFloat(formData.get('bag_weight_kg') as string),
      delivery_cost: parseFloat(formData.get('delivery_cost') as string) || 0,
      phone: formData.get('phone') as string || null,
      notes: formData.get('notes') as string || null,
    };

    try {
      const { error } = await supabase.from('suppliers').insert(newSupplier);
      if (error) throw error;
      
      toast.success('تمت إضافة المورد بنجاح');
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
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>إضافة مورد جديد</h2>
          <button className="btn-ghost" style={{ padding: '0.4rem' }} onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="label">اسم المورد *</label>
              <input name="name" className="input-field" required placeholder="اسم المورد أو المصنع" />
            </div>
            <div>
              <label className="label">نوع الفحم *</label>
              <select name="charcoal_type" className="input-field" required>
                <option value="">اختر نوع...</option>
                <option value="orange">برتقال</option>
                <option value="lemon">ليمون</option>
                <option value="guava">جوافة</option>
                <option value="mango">مانجو</option>
                <option value="mixed">مشكل</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="label">وزن الشيكارة (كجم) *</label>
              <input name="bag_weight_kg" type="number" step="0.1" className="input-field" required defaultValue={15} />
            </div>
            <div>
              <label className="label">سعر الكيلو *</label>
              <input name="price_per_kg" type="number" step="0.01" className="input-field" required placeholder="0" />
            </div>
            <div>
              <label className="label">سعر الشيكارة *</label>
              <input name="price_per_bag" type="number" step="0.01" className="input-field" required placeholder="0" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="label">رقم الهاتف</label>
              <input name="phone" className="input-field" placeholder="01xxxxxxxxx" />
            </div>
            <div>
              <label className="label">تكلفة التوصيل (نقل)</label>
              <input name="delivery_cost" type="number" className="input-field" placeholder="0" defaultValue={0} />
            </div>
          </div>

          <div>
            <label className="label">ملاحظات</label>
            <textarea name="notes" className="input-field" rows={2} placeholder="أية تفاصيل إضافية..." style={{ resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>إلغاء</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'جاري الحفظ...' : 'حفظ المورد'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
