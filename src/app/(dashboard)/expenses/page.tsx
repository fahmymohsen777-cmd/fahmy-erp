'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Wallet, Calendar, TrendingDown, X, Building, Truck, Users, Receipt, FileText, FileDown } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { exportToExcel, printToPDF } from '@/lib/exportUtils';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [filterCategory, setFilterCategory] = useState('all');

  const supabase = createClient();

  const fetchExpenses = async () => {
    try {
      const [year, month] = filterMonth.split('-');
      const startDate = `${year}-${month}-01`;
      const endDate = new Date(Number(year), Number(month), 0).toISOString().slice(0, 10);

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .gte('expense_date', startDate)
        .lte('expense_date', endDate)
        .order('expense_date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error: any) {
      toast.error('حدث خطأ أثناء جلب المصروفات');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [filterMonth]);

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المصروف؟')) return;
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      toast.success('تم الحذف بنجاح');
      fetchExpenses();
    } catch (err) {
      toast.error('خطأ في الحذف');
    }
  };

  const filteredExpenses = expenses.filter(e => {
    if (filterCategory === 'all') return true;
    return e.category === filterCategory;
  });

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const getCategoryIcon = (cat: string) => {
    if (cat === 'إيجار') return <Building size={16} />;
    if (cat === 'نقل') return <Truck size={16} />;
    if (cat === 'عمالة') return <Users size={16} />;
    return <Receipt size={16} />;
  };

  const handleExportExcel = () => {
    const data = filteredExpenses.map(e => ({
      'التصنيف': e.category,
      'الوصف': e.description,
      'التاريخ': formatDate(e.expense_date),
      'المبلغ': e.amount,
    }));
    exportToExcel(data, `expenses_report_${filterMonth}`);
  };

  const handlePrintPDF = () => {
    const printData = filteredExpenses.map(e => ({
      category: e.category,
      desc: e.description,
      dateStr: e.expense_date,
      amount: e.amount,
    }));
    printToPDF(`تقرير المصروفات - شهر ${filterMonth}`, [
      { header: 'التصنيف', key: 'category' },
      { header: 'التاريخ', key: 'dateStr', format: 'date' },
      { header: 'الوصف', key: 'desc' },
      { header: 'المبلغ', key: 'amount', format: 'currency' },
    ], printData);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Header & Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--color-danger-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <TrendingDown size={20} color="var(--color-danger)" />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-danger)' }}>{formatCurrency(totalExpenses)}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>إجمالي مصروفات الشهر المحددة</div>
          </div>
        </motion.div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Calendar size={18} style={{ color: 'var(--text-muted)' }} />
          <input 
            type="month" 
            className="input-field" 
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            style={{ width: 'auto' }}
          />
          <select className="input-field" style={{ width: 'auto' }} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="all">كل التصنيفات</option>
            <option value="إيجار">إيجار</option>
            <option value="عمالة">عمالة</option>
            <option value="نقل">نقل وصيانة</option>
            <option value="أخرى">أخرى</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-secondary" style={{ fontSize: '0.82rem', padding: '0.5rem' }} onClick={handlePrintPDF}>
            <FileText size={15} /> طباعة
          </button>
          <button className="btn-secondary" style={{ fontSize: '0.82rem', padding: '0.5rem' }} onClick={handleExportExcel}>
            <FileDown size={15} /> Excel
          </button>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> إضافة مصروف
          </button>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>سجل المصروفات التشغيلية</h2>
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>التصنيف</th><th>الوصف</th><th>المبلغ</th><th>التاريخ</th><th>إجراءات</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>جاري التحميل...</td></tr>
              ) : filteredExpenses.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>لا توجد مصروفات مسجلة</td></tr>
              ) : filteredExpenses.map((exp: any, i: number) => (
                <motion.tr key={exp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {getCategoryIcon(exp.category)}
                      <span style={{ fontWeight: 600 }}>{exp.category}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{exp.description}</td>
                  <td style={{ fontWeight: 700, color: 'var(--color-danger)' }}>{formatCurrency(exp.amount)}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{formatDate(exp.expense_date)}</td>
                  <td>
                    <button onClick={() => handleDelete(exp.id)} className="btn-ghost" style={{ padding: '0.4rem', color: 'var(--color-danger)' }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && <AddExpenseModal onClose={() => setShowAddModal(false)} onAdd={fetchExpenses} />}
      </AnimatePresence>
    </div>
  );
}

function AddExpenseModal({ onClose, onAdd }: { onClose: () => void, onAdd: () => void }) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      category: formData.get('category') as string,
      amount: parseFloat(formData.get('amount') as string),
      description: formData.get('description') as string,
      expense_date: formData.get('expense_date') as string,
    };

    try {
      const { error } = await supabase.from('expenses').insert(data);
      if (error) throw error;
      toast.success('تمت الإضافة بنجاح');
      onAdd();
      onClose();
    } catch (error: any) {
      toast.error('حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card" style={{ width: '100%', maxWidth: 450, padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>تسجيل مصروف جديد</h2>
          <button className="btn-ghost" style={{ padding: '0.4rem' }} onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="label">التصنيف *</label>
            <select name="category" className="input-field" required>
              <option value="إيجار">إيجار</option>
              <option value="عمالة">عمالة</option>
              <option value="نقل">نقل ومواصلات</option>
              <option value="كهرباء ومرافق">كهرباء ومرافق</option>
              <option value="أخرى">أخرى</option>
            </select>
          </div>
          <div>
            <label className="label">المبلغ (جنيه) *</label>
            <input name="amount" type="number" step="0.01" className="input-field" placeholder="0" required />
          </div>
          <div>
            <label className="label">التاريخ *</label>
            <input name="expense_date" type="date" className="input-field" defaultValue={new Date().toISOString().split('T')[0]} required />
          </div>
          <div>
            <label className="label">الوصف التفصيلي *</label>
            <textarea name="description" className="input-field" rows={2} placeholder="مثال: راتب السائق لشهر يناير..." required />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>إلغاء</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              <Wallet size={16} /> {loading ? 'جاري الحفظ...' : 'حفظ المصروف'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
