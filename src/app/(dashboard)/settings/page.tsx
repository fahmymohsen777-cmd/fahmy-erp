'use client';
import { motion } from 'framer-motion';
import { Users, Shield, Building, Bell, Palette, Save, AlertTriangle, Trash2 } from 'lucide-react';
import { mockUsers } from '@/lib/mock-data';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

const roleLabels: Record<string, string> = {
  admin: 'مدير النظام',
  sales: 'مبيعات',
  warehouse: 'مستودع',
  driver: 'سائق',
};

const roleColors: Record<string, string> = {
  admin: '#f59e0b',
  sales: '#3b82f6',
  warehouse: '#10b981',
  driver: '#8b5cf6',
};

export default function SettingsPage() {
  const [wiping, setWiping] = useState(false);

  const handleWipeData = async () => {
    if (prompt('هل أنت متأكد من مسح جميع بيانات النظام (طلبات، عملاء، مصروفات، وحركة المخزن) للبدء من جديد؟\\n\\nاكتب كلمة "نعم" للتأكيد:') !== 'نعم') {
      return;
    }
    
    setWiping(true);
    toast.loading('جاري مسح البيانات...', { id: 'wipe' });
    try {
      const supabase = createClient();
      
      // Order is important due to foreign keys!
      await supabase.from('inventory_movements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('supplier_payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('suppliers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // Reset inventory balances instead of deleting charcoal types
      await supabase.from('inventory').update({
        warehouse_stock: 0,
        incoming_stock: 0,
        outgoing_stock: 0,
        damaged_stock: 0,
        reserved_stock: 0
      }).neq('id', '00000000-0000-0000-0000-000000000000');

      toast.success('تم مسح جميع البيانات وتصفير النظام بنجاح!', { id: 'wipe' });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'حدث خطأ أثناء مسح البيانات.', { id: 'wipe' });
    } finally {
      setWiping(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Company Info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--color-amber-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Building size={18} color="var(--color-amber)" /></div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>معلومات الشركة</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div><label className="label">اسم الشركة</label><input className="input-field" defaultValue="فحم" /></div>
          <div><label className="label">رقم التسجيل</label><input className="input-field" defaultValue="EG-2024-FHM" /></div>
          <div><label className="label">العنوان</label><input className="input-field" defaultValue="القاهرة، مصر" /></div>
          <div><label className="label">الهاتف</label><input className="input-field" defaultValue="01012345678" /></div>
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-primary"><Save size={16} /> حفظ التغييرات</button>
        </div>
      </motion.div>

      {/* Users */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--color-info-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={18} color="#3b82f6" /></div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>إدارة المستخدمين</h2>
          </div>
          <button className="btn-primary" style={{ fontSize: '0.82rem' }}>+ مستخدم جديد</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {mockUsers.map((user, i) => (
            <motion.div key={user.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.06 }} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem', background: 'var(--color-surface-2)', borderRadius: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${roleColors[user.role]}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', color: roleColors[user.role], flexShrink: 0 }}>
                {user.full_name[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.full_name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{user.email}</div>
              </div>
              <span style={{ background: `${roleColors[user.role]}22`, color: roleColors[user.role], border: `1px solid ${roleColors[user.role]}44`, borderRadius: 20, padding: '3px 10px', fontSize: '0.78rem', fontWeight: 600 }}>
                {roleLabels[user.role]}
              </span>
              <button className="btn-ghost" style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}>تعديل</button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Notification Settings */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--color-amber-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Bell size={18} color="var(--color-amber)" /></div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>إعدادات الإشعارات</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[
            'إشعار عند وجود ديون متأخرة',
            'إشعار عند عدم الدفع لمدة 30 يوم',
            'إشعار عند انخفاض المخزون',
            'إشعار عند استحقاق دفعات الموردين',
            'إشعار عند عدم طلب العميل لمدة 30 يوم',
          ].map((setting, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1rem', background: 'var(--color-surface-2)', borderRadius: 10 }}>
              <span style={{ fontSize: '0.88rem' }}>{setting}</span>
              <div style={{ width: 44, height: 24, borderRadius: 12, background: 'var(--color-amber)', position: 'relative', cursor: 'pointer' }}>
                <div style={{ position: 'absolute', right: 2, top: 2, width: 20, height: 20, borderRadius: '50%', background: '#000', transition: 'right 0.2s' }} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card" style={{ padding: '1.5rem', border: '1px solid rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--color-danger-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertTriangle size={18} color="var(--color-danger)" /></div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-danger)' }}>منطقة الخطر (Danger Zone)</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', marginRight: '3rem' }}>
          استخدم هذا الزر لمسح جميع بيانات النظام التجريبية للبدء على نظام نظيف تماماً. سيتم مسح (العملاء، الموردين، الطلبيات، الفواتير، المصروفات) وتصفير المخزن. لن يتم مسح المستخدمين أو أصناف الفحم. لا يمكن التراجع عن هذه الخطوة.
        </p>
        <div style={{ marginRight: '3rem' }}>
          <button 
            className="btn-primary" 
            style={{ background: 'var(--color-danger)', boxShadow: '0 4px 15px rgba(244,63,94,0.3)', color: '#fff' }}
            onClick={handleWipeData}
            disabled={wiping}
          >
            {wiping ? 'جاري المسح...' : <><Trash2 size={16} /> مسح جميع البيانات التجريبية والتصفير</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
