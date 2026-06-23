'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ArrowDown, ArrowUp, AlertTriangle, Warehouse, BarChart3, FileText, FileDown, Plus, X } from 'lucide-react';
import { formatNumber, getCharcoalTypeLabel, getCharcoalTypeColor, formatDate } from '@/lib/utils';
import { InventoryItem, InventoryMovement } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { exportToExcel, printToPDF } from '@/lib/exportUtils';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterType, setFilterType] = useState('all');

  const supabase = createClient();

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const { data: invData, error: invError } = await supabase
          .from('inventory')
          .select('*')
          .order('charcoal_type');
        if (invError) throw invError;
        setInventory(invData || []);

        const { data: movData, error: movError } = await supabase
          .from('inventory_movements')
          .select(`
            *,
            supplier:suppliers(name),
            customer:customers(cafe_name),
            user:profiles(full_name)
          `)
          .order('created_at', { ascending: false })
          .limit(50);
        if (movError) throw movError;
        setMovements(movData || []);

      } catch (error: any) {
        toast.error('حدث خطأ أثناء جلب بيانات المخزون');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  const totalStock = inventory.reduce((sum, i) => sum + Number(i.warehouse_stock), 0);
  const lowStockItems = inventory.filter(i => Number(i.warehouse_stock) < Number(i.minimum_stock));

  const filteredMovements = movements.filter(m => {
    let matchType = filterType === 'all' || m.movement_type === filterType;
    let matchDate = true;
    const movDate = m.created_at.split('T')[0];
    if (startDate && movDate < startDate) matchDate = false;
    if (endDate && movDate > endDate) matchDate = false;
    return matchType && matchDate;
  });

  const handleExportExcel = () => {
    const data = filteredMovements.map(m => ({
      'النوع': m.movement_type === 'in' ? 'توريد' : m.movement_type === 'out' ? 'منصرف' : m.movement_type === 'damaged' ? 'تالف' : m.movement_type === 'return' ? 'مرتجع' : 'محجوز',
      'الفحم': getCharcoalTypeLabel(m.charcoal_type),
      'الكمية (شيكارة)': m.quantity,
      'المصدر/الوجهة': m.supplier ? m.supplier.name : m.customer ? m.customer.cafe_name : '—',
      'التاريخ': formatDate(m.created_at),
      'المستخدم': m.user?.full_name || '—',
    }));
    exportToExcel(data, 'inventory_movements');
  };

  const handlePrintPDF = () => {
    const printData = filteredMovements.map(m => ({
      typeStr: m.movement_type === 'in' ? 'توريد' : m.movement_type === 'out' ? 'منصرف' : m.movement_type === 'damaged' ? 'تالف' : m.movement_type === 'return' ? 'مرتجع' : 'محجوز',
      charcoalStr: getCharcoalTypeLabel(m.charcoal_type),
      qty: m.quantity,
      target: m.supplier ? m.supplier.name : m.customer ? m.customer.cafe_name : '—',
      dateStr: m.created_at,
      userStr: m.user?.full_name || '—',
    }));
    printToPDF('سجل حركة المخزون', [
      { header: 'النوع', key: 'typeStr' },
      { header: 'الصنف', key: 'charcoalStr' },
      { header: 'الكمية', key: 'qty' },
      { header: 'المصدر/الوجهة', key: 'target' },
      { header: 'التاريخ', key: 'dateStr', format: 'date' },
      { header: 'المسؤول', key: 'userStr' },
    ], printData);
  };

  const handleAdjustmentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const charcoalType = formData.get('charcoalType') as string;
    const adjustType = formData.get('adjustType') as string;
    const quantity = Number(formData.get('quantity'));
    const notes = formData.get('notes') as string;

    if (!quantity || quantity <= 0) return toast.error('أدخل كمية صحيحة');

    setLoadingSubmit(true);
    toast.loading('جاري تنفيذ التسوية...', { id: 'adjust' });
    try {
      const { data: inv, error: invErr } = await supabase.from('inventory').select('*').eq('charcoal_type', charcoalType).single();
      if (invErr) throw invErr;

      let updates: any = {};
      if (adjustType === 'damaged') {
        if (inv.warehouse_stock < quantity) throw new Error('رصيد المستودع لا يكفي');
        updates = { warehouse_stock: inv.warehouse_stock - quantity, damaged_stock: inv.damaged_stock + quantity };
      } else if (adjustType === 'return') {
        updates = { warehouse_stock: inv.warehouse_stock + quantity };
      } else if (adjustType === 'in') {
        updates = { warehouse_stock: inv.warehouse_stock + quantity, incoming_stock: inv.incoming_stock + quantity };
      } else if (adjustType === 'out') {
        if (inv.warehouse_stock < quantity) throw new Error('رصيد المستودع لا يكفي');
        updates = { warehouse_stock: inv.warehouse_stock - quantity, outgoing_stock: inv.outgoing_stock + quantity };
      }

      const { error: updateErr } = await supabase.from('inventory').update(updates).eq('charcoal_type', charcoalType);
      if (updateErr) throw updateErr;

      const userRes = await supabase.auth.getUser();
      const userId = userRes.data.user?.id || '00000000-0000-0000-0000-000000000000';
      const { error: movErr } = await supabase.from('inventory_movements').insert({
        charcoal_type: charcoalType,
        movement_type: adjustType,
        quantity,
        notes,
        user_id: userId
      });
      if (movErr) throw movErr;

      toast.success('تم تنفيذ التسوية بنجاح', { id: 'adjust' });
      setShowAdjustmentModal(false);
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || 'خطأ في تنفيذ التسوية', { id: 'adjust' });
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>إدارة المخزون</h1>
        <button className="btn-primary" onClick={() => setShowAdjustmentModal(true)}>
          <Plus size={16} /> تسوية جردية (تالف/مرتجع)
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'إجمالي المخزون', value: `${formatNumber(totalStock)} شيكارة`, icon: <Warehouse size={18} color="#f59e0b" />, bg: 'var(--color-amber-dim)' },
          { label: 'أنواع الفحم', value: String(inventory.length), icon: <BarChart3 size={18} color="#8b5cf6" />, bg: 'var(--color-purple-dim)' },
          { label: 'أصناف منخفضة', value: String(lowStockItems.length), icon: <AlertTriangle size={18} color={lowStockItems.length > 0 ? '#f43f5e' : '#10b981'} />, bg: lowStockItems.length > 0 ? 'var(--color-danger-dim)' : 'var(--color-success-dim)' },
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

      {/* Inventory Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--color-amber)' }}></div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {inventory.map((item, i) => {
            const typeColor = getCharcoalTypeColor(item.charcoal_type);
            const isLow = Number(item.warehouse_stock) < Number(item.minimum_stock);
            const pct = Math.min((Number(item.warehouse_stock) / (Number(item.minimum_stock) * 3)) * 100, 100);
            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, left: 0, height: 3, background: `linear-gradient(90deg, transparent, ${typeColor}, transparent)` }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: typeColor }} />
                    <span style={{ fontSize: '1rem', fontWeight: 700 }}>{getCharcoalTypeLabel(item.charcoal_type)}</span>
                  </div>
                  {isLow && (
                    <span className="badge badge-danger"><AlertTriangle size={11} /> منخفض</span>
                  )}
                </div>

                {/* Main Stock */}
                <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: isLow ? 'var(--color-danger)' : 'var(--text-primary)', lineHeight: 1 }}>
                    {formatNumber(Number(item.warehouse_stock))}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>شيكارة في المستودع</div>
                </div>

                {/* Progress */}
                <div className="progress-bar" style={{ marginBottom: '1rem' }}>
                  <div className="progress-fill" style={{ width: `${pct}%`, background: isLow ? 'linear-gradient(90deg, var(--color-danger), #fb7185)' : `linear-gradient(90deg, ${typeColor}, ${typeColor}99)` }} />
                </div>

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {[
                    { label: 'وارد', value: item.incoming_stock, icon: <ArrowDown size={13} color="var(--color-success)" />, color: 'var(--color-success-dim)' },
                    { label: 'صادر', value: item.outgoing_stock, icon: <ArrowUp size={13} color="var(--color-danger)" />, color: 'var(--color-danger-dim)' },
                    { label: 'تالف', value: item.damaged_stock, icon: <AlertTriangle size={13} color="#f97316" />, color: 'rgba(249,115,22,0.15)' },
                    { label: 'محجوز', value: item.reserved_stock, icon: <Package size={13} color="#8b5cf6" />, color: 'var(--color-purple-dim)' },
                  ].map(stat => (
                    <div key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: 6, background: stat.color, borderRadius: 8, padding: '0.5rem 0.625rem' }}>
                      {stat.icon}
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{stat.label}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, marginRight: 'auto' }}>{formatNumber(Number(stat.value))}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>الحد الأدنى: {formatNumber(Number(item.minimum_stock))} شيكارة</div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Movement History */}
      {!loading && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>سجل حركة المخزون</h2>
            
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <select className="input-field" style={{ padding: '0.5rem', fontSize: '0.82rem', width: 120 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="all">الكل</option>
                <option value="in">توريد (وارد)</option>
                <option value="out">منصرف (صادر)</option>
                <option value="return">مرتجع عميل</option>
                <option value="damaged">تالف</option>
                <option value="reserved">محجوز</option>
              </select>
              <input type="date" className="input-field" style={{ padding: '0.5rem', fontSize: '0.82rem', width: 130 }} value={startDate} onChange={e => setStartDate(e.target.value)} />
              <input type="date" className="input-field" style={{ padding: '0.5rem', fontSize: '0.82rem', width: 130 }} value={endDate} onChange={e => setEndDate(e.target.value)} />

              <button onClick={handlePrintPDF} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                <FileText size={14} /> طباعة
              </button>
              <button onClick={handleExportExcel} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                <FileDown size={14} /> Excel
              </button>
            </div>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>النوع</th><th>الفحم</th><th>الكمية</th><th>المصدر/الوجهة</th><th>التاريخ</th><th>المستخدم</th></tr></thead>
              <tbody>
                {filteredMovements.map(m => (
                  <tr key={m.id}>
                    <td>
                      {m.movement_type === 'in' && <span className="badge badge-success"><ArrowDown size={11} /> توريد</span>}
                      {m.movement_type === 'out' && <span className="badge badge-danger"><ArrowUp size={11} /> منصرف</span>}
                      {m.movement_type === 'return' && <span className="badge badge-success"><ArrowDown size={11} /> مرتجع عميل</span>}
                      {m.movement_type === 'damaged' && <span className="badge badge-warning"><AlertTriangle size={11} /> تالف</span>}
                      {m.movement_type === 'reserved' && <span className="badge badge-info"><Package size={11} /> محجوز</span>}
                    </td>
                    <td>{getCharcoalTypeLabel(m.charcoal_type)}</td>
                    <td style={{ fontWeight: 700 }}>{m.quantity} شيكارة</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      {m.supplier ? m.supplier.name : m.customer ? m.customer.cafe_name : '—'}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatDate(m.created_at)}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.user?.full_name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredMovements.length === 0 && (
              <div className="empty-state">
                <Package size={40} style={{ color: 'var(--text-muted)' }} />
                <p style={{ color: 'var(--text-muted)' }}>لا يوجد حركات مخزون</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Adjustment Modal */}
      <AnimatePresence>
        {showAdjustmentModal && (
          <div className="modal-overlay">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="modal-content">
              <div className="modal-header">
                <h2>تسوية جردية (تالف/مرتجع/تعديل)</h2>
                <button onClick={() => setShowAdjustmentModal(false)} className="btn-ghost" style={{ padding: 4 }}><X size={20} /></button>
              </div>
              <form onSubmit={handleAdjustmentSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', padding: '1.5rem' }}>
                  
                  <div>
                    <label className="label">الصنف (نوع الفحم)</label>
                    <select name="charcoalType" className="input-field" required>
                      {inventory.map(i => <option key={i.id} value={i.charcoal_type}>{getCharcoalTypeLabel(i.charcoal_type)}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="label">نوع التسوية</label>
                    <select name="adjustType" className="input-field" required>
                      <option value="damaged">⚠️ تسجيل هالك / تالف (يخصم من المستودع)</option>
                      <option value="return">🔄 مرتجع من عميل (يضاف للمستودع)</option>
                      <option value="in">➕ إضافة رصيد يدوية (تسوية بالزيادة)</option>
                      <option value="out">➖ سحب رصيد يدوية (تسوية بالنقص)</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">الكمية (شيكارة)</label>
                    <input type="number" name="quantity" min="1" step="1" className="input-field" required />
                  </div>

                  <div>
                    <label className="label">ملاحظات / السبب</label>
                    <input type="text" name="notes" className="input-field" placeholder="مثال: مرتجع من عميل بسبب..." />
                  </div>

                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setShowAdjustmentModal(false)}>إلغاء</button>
                  <button type="submit" className="btn-primary" disabled={loadingSubmit}>
                    {loadingSubmit ? 'جاري التنفيذ...' : 'تنفيذ التسوية'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
