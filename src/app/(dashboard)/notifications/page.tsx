'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, AlertCircle, Clock, Package, Truck, CheckCheck } from 'lucide-react';
import { mockNotifications } from '@/lib/mock-data';
import { formatDateTime } from '@/lib/utils';
import { AppNotification } from '@/lib/types';

function getNotifIcon(type: AppNotification['type']) {
  switch (type) {
    case 'overdue_balance': return <AlertCircle size={18} color="var(--color-danger)" />;
    case 'no_payment_30_days': return <Clock size={18} color="#f59e0b" />;
    case 'low_stock': return <Package size={18} color="#3b82f6" />;
    case 'supplier_payment_due': return <Truck size={18} color="#8b5cf6" />;
    default: return <Bell size={18} color="var(--text-muted)" />;
  }
}

function getNotifBg(type: AppNotification['type']) {
  switch (type) {
    case 'overdue_balance': return 'var(--color-danger-dim)';
    case 'no_payment_30_days': return 'var(--color-amber-dim)';
    case 'low_stock': return 'var(--color-info-dim)';
    case 'supplier_payment_due': return 'var(--color-purple-dim)';
    default: return 'var(--color-surface-2)';
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const unread = notifications.filter(n => !n.is_read).length;

  const markAllRead = () => setNotifications(notifications.map(n => ({ ...n, is_read: true })));
  const markRead = (id: string) => setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>الإشعارات</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 3 }}>{unread} إشعار غير مقروء</p>
        </div>
        {unread > 0 && (
          <button className="btn-secondary" style={{ fontSize: '0.82rem' }} onClick={markAllRead}>
            <CheckCheck size={15} /> تعليم الكل كمقروء
          </button>
        )}
      </div>

      {/* Notification List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {notifications.map((notif, i) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => markRead(notif.id)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-lg)',
              background: notif.is_read ? 'var(--color-surface)' : 'var(--color-surface-2)',
              border: `1px solid ${notif.is_read ? 'var(--color-border)' : 'rgba(255,255,255,0.1)'}`,
              cursor: 'pointer',
              transition: 'all 0.2s',
              opacity: notif.is_read ? 0.6 : 1,
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 12, background: getNotifBg(notif.type), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {getNotifIcon(notif.type)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: notif.is_read ? 500 : 700, fontSize: '0.9rem' }}>{notif.title}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDateTime(notif.created_at)}</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>{notif.message}</p>
              {notif.customer && (
                <div style={{ marginTop: 6, fontSize: '0.78rem', color: 'var(--color-amber)', fontWeight: 600 }}>{notif.customer.cafe_name} — {notif.customer.owner_name}</div>
              )}
            </div>
            {!notif.is_read && <div className="notif-dot" style={{ marginTop: 6 }} />}
          </motion.div>
        ))}
        {notifications.length === 0 && (
          <div className="empty-state">
            <Bell size={40} style={{ color: 'var(--text-muted)' }} />
            <p style={{ color: 'var(--text-muted)' }}>لا توجد إشعارات</p>
          </div>
        )}
      </div>
    </div>
  );
}
