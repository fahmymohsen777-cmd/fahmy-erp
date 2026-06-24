'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Truck, Package, CheckCircle, Clock, X, FileDown, FileText, DollarSign } from 'lucide-react';
import { formatCurrency, formatDate, getOrderStatusLabel, getOrderStatusColor, getCharcoalTypeLabel } from '@/lib/utils';
import { OrderStatus, Order, Customer, Profile } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { exportToExcel, printToPDF } from '@/lib/exportUtils';
import { useAuth } from '@/lib/store/authStore';

const statusTabs: { value: 'all' | OrderStatus; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'الكل', icon: <Filter size={15} /> },
  { value: 'pending', label: 'معلق', icon: <Clock size={15} /> },
  { value: 'in_delivery', label: 'جاري التوصيل', icon: <Truck size={15} /> },
  { value: 'delivered', label: 'تم التسليم', icon: <Package size={15} /> },
  { value: 'collected', label: 'تم التحصيل', icon: <CheckCircle size={15} /> },
];

export default function OrdersPage() {
  const { role } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [drivers, setDrivers] = useState<Profile[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState<'all' | OrderStatus>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const supabase = createClient();

  const fetchData = async () => {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(*),
          driver:profiles(*),
          items:order_items(*)
        `)
        .order('created_at', { ascending: false });
        
      if (ordersError) throw ordersError;

      const enrichedOrders = (ordersData || []).map((o: any) => ({
        ...o,
        total_quantity: o.items?.reduce((sum: number, i: any) => sum + Number(i.quantity), 0) || 0,
        total_amount: o.items?.reduce((sum: number, i: any) => sum + Number(i.total_price), 0) || 0,
      }));

      setOrders(enrichedOrders);

      const { data: customersData } = await supabase.from('customers').select('*').order('cafe_name');
      setCustomers(customersData || []);

      const { data: driversData } = await supabase.from('profiles').select('*').eq('role', 'driver');
      setDrivers(driversData || []);

    } catch (error: any) {
      toast.error('حدث خطأ أثناء جلب البيانات');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = orders.filter(o => {
    const matchSearch = o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.cafe_name.includes(search);
    const matchStatus = activeStatus === 'all' || o.status === activeStatus;
    
    let matchDate = true;
    const orderDate = o.created_at.split('T')[0];
    if (startDate && orderDate < startDate) matchDate = false;
    if (endDate && orderDate > endDate) matchDate = false;

    return matchSearch && matchStatus && matchDate;
  });

  const handleExportExcel = () => {
    const data = filtered.map(o => ({
      'رقم الطلب': o.order_number,
      'العميل': o.customer?.cafe_name,
      'التاريخ': formatDate(o.created_at),
      'الحالة': getOrderStatusLabel(o.status),
      'الكمية (شيكارة)': o.total_quantity,
      'الإجمالي': o.total_amount,
    }));
    exportToExcel(data, 'orders_report');
  };

  const handlePrintPDF = () => {
    const printData = filtered.map(o => ({
      order_number: o.order_number,
      customer_name: o.customer?.cafe_name,
      dateStr: o.created_at,
      statusLabel: getOrderStatusLabel(o.status),
      qty: o.total_quantity,
      total: o.total_amount,
    }));
    printToPDF('سجل الطلبات', [
      { header: 'رقم الطلب', key: 'order_number' },
      { header: 'العميل', key: 'customer_name' },
      { header: 'التاريخ', key: 'dateStr', format: 'date' },
      { header: 'الحالة', key: 'statusLabel' },
      { header: 'الكمية', key: 'qty' },
      { header: 'الإجمالي', key: 'total', format: 'currency' },
    ], printData);
  };

  const counts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    in_delivery: orders.filter(o => o.status === 'in_delivery').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    collected: orders.filter(o => o.status === 'collected').length,
  };

  const totalAmount = filtered.reduce((sum, o) => sum + (o.total_amount ?? 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {statusTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveStatus(tab.value)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '0.5rem 1rem', borderRadius: 10, fontSize: '0.85rem',
              fontWeight: activeStatus === tab.value ? 700 : 500,
              background: activeStatus === tab.value ? 'var(--color-amber-dim)' : 'var(--color-surface-2)',
              color: activeStatus === tab.value ? 'var(--color-amber-light)' : 'var(--text-secondary)',
              border: activeStatus === tab.value ? '1px solid rgba(245,158,11,0.3)' : '1px solid var(--color-border)',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {tab.icon} {tab.label}
            <span style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: '1px 6px', fontSize: '0.75rem' }}>
              {counts[tab.value]}
            </span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input-field"
            style={{ paddingRight: 40 }}
            placeholder="ابحث برقم الطلب، أو الكافيه..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '0.5rem 1rem', fontSize: '0.85rem', color: 'var(--color-amber)', fontWeight: 700 }}>
          {formatCurrency(filtered.reduce((sum, o) => sum + (o.total_amount ?? 0), 0))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input 
            type="date" 
            className="input-field" 
            style={{ padding: '0.5rem', fontSize: '0.82rem', width: 130 }}
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
          <input 
            type="date" 
            className="input-field" 
            style={{ padding: '0.5rem', fontSize: '0.82rem', width: 130 }}
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handlePrintPDF} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}>
            <FileText size={16} /> طباعة
          </button>
          <button onClick={handleExportExcel} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}>
            <FileDown size={16} /> Excel
          </button>
          {role === 'admin' && (
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}><Plus size={16} /> طلب جديد</button>
          )}
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--color-amber)' }}></div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>العميل</th>
                <th>الفحم</th>
                <th>الكمية</th>
                <th>الإجمالي</th>
                <th>التوصيل</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order, i) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <td style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--color-amber)' }}>{order.order_number}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{order.customer?.cafe_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.customer?.owner_name}</div>
                  </td>
                  <td>
                    {order.items?.map((item: any) => (
                      <span key={item.id} style={{ display: 'inline-block', marginLeft: 4, background: 'var(--color-surface-3)', borderRadius: 6, padding: '1px 7px', fontSize: '0.78rem' }}>
                        {getCharcoalTypeLabel(item.charcoal_type)}
                      </span>
                    ))}
                  </td>
                  <td style={{ fontWeight: 700 }}>{order.total_quantity} شيكارة</td>
                  <td style={{ color: 'var(--color-amber)', fontWeight: 700 }}>{formatCurrency(order.total_amount ?? 0)}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{formatDate(order.delivery_date)}</td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background: `${getOrderStatusColor(order.status)}22`,
                        color: getOrderStatusColor(order.status),
                        border: `1px solid ${getOrderStatusColor(order.status)}44`,
                      }}
                    >
                      {getOrderStatusLabel(order.status)}
                    </span>
                  </td>
                  <td>
                    <select
                      className="input-field"
                      style={{ padding: '0.3rem', fontSize: '0.75rem', height: 'auto', minWidth: 100 }}
                      value={order.status}
                      onChange={async (e) => {
                        const newStatus = e.target.value;
                        const tId = toast.loading('جاري التحديث...');
                        try {
                          const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
                          if (error) throw error;
                          toast.success('تم تحديث الحالة', { id: tId });
                          fetchData();
                        } catch (err) {
                          console.error(err);
                          toast.error('خطأ في التحديث', { id: tId });
                        }
                      }}
                    >
                      <option value="pending">معلق</option>
                      <option value="in_delivery">جاري التوصيل</option>
                      <option value="delivered">تم التسليم</option>
                      <option value="collected">تم التحصيل</option>
                    </select>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <Package size={40} style={{ color: 'var(--text-muted)' }} />
            <p style={{ color: 'var(--text-muted)' }}>لا توجد طلبات</p>
          </div>
        )}
      </div>

      {/* Create Order Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <AddOrderModal 
            customers={customers} 
            drivers={drivers}
            onClose={() => setShowCreateModal(false)} 
            onAdd={fetchData} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AddOrderModal({ customers, drivers, onClose, onAdd }: { customers: Customer[], drivers: Profile[], onClose: () => void, onAdd: () => void }) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const customer_id = formData.get('customer_id') as string;
    const charcoal_type = formData.get('charcoal_type') as string;
    const quantity = parseInt(formData.get('quantity') as string);
    const price_per_unit = parseFloat(formData.get('price_per_unit') as string);
    const delivery_date = formData.get('delivery_date') as string;
    const driver_id = formData.get('driver_id') as string || null;
    const notes = formData.get('notes') as string || null;

    if (!customer_id || !charcoal_type || !quantity || !price_per_unit || !delivery_date) {
      toast.error('يرجى تعبئة الحقول الإلزامية');
      setLoading(false);
      return;
    }

    try {
      // 1. Insert Order
      const order_number = `ORD-${Date.now().toString().slice(-6)}`;
      const { data: newOrder, error: orderError } = await supabase.from('orders').insert({
        order_number,
        customer_id,
        driver_id,
        delivery_date,
        notes,
        status: 'pending'
      }).select('id').single();

      if (orderError) throw orderError;

      // 2. Insert Order Item
      const { error: itemError } = await supabase.from('order_items').insert({
        order_id: newOrder.id,
        charcoal_type,
        quantity,
        price_per_unit
      });

      if (itemError) throw itemError;

      // 3. Record Outgoing Inventory Movement
      const { error: movErr } = await supabase.from('inventory_movements').insert({
        charcoal_type,
        movement_type: 'out',
        quantity,
        customer_id,
        order_id: newOrder.id,
        notes: `طلب رقم ${order_number}`
      });
      if (movErr) throw movErr;

      // 4. Update Warehouse Stock
      const { data: inv } = await supabase.from('inventory').select('warehouse_stock').eq('charcoal_type', charcoal_type).single();
      if (inv) {
        await supabase.from('inventory').update({ warehouse_stock: Number(inv.warehouse_stock) - quantity }).eq('charcoal_type', charcoal_type);
      }

      toast.success('تم إنشاء الطلب بنجاح وخصم الكمية من المخزن');
      onAdd();
      onClose();
    } catch (error: any) {
      toast.error('حدث خطأ أثناء إنشاء الطلب');
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
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>إنشاء طلب توصيل جديد</h2>
          <button className="btn-ghost" style={{ padding: '0.4rem' }} onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="label">العميل *</label>
            <select name="customer_id" className="input-field" required>
              <option value="">اختر عميل...</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.cafe_name} ({c.owner_name})</option>)}
            </select>
            {customers.length === 0 && <span style={{fontSize:'0.75rem', color:'var(--color-amber)', marginTop:4}}>لا يوجد عملاء، قم بإضافتهم أولاً من شاشة العملاء</span>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
            <div>
              <label className="label">الكمية (شيكارة) *</label>
              <input name="quantity" className="input-field" type="number" placeholder="0" min="1" required />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="label">سعر الشيكارة (جنيه) *</label>
              <input name="price_per_unit" className="input-field" type="number" placeholder="0" step="0.01" required />
            </div>
            <div>
              <label className="label">تاريخ التوصيل *</label>
              <input name="delivery_date" className="input-field" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
          </div>
          <div>
            <label className="label">السائق (اختياري)</label>
            <select name="driver_id" className="input-field">
              <option value="">اختر سائق...</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">ملاحظات</label>
            <textarea name="notes" className="input-field" rows={3} placeholder="ملاحظات إضافية..." style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>إلغاء</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              <DollarSign size={16} /> {loading ? 'جاري الحفظ...' : 'حفظ الطلب'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
