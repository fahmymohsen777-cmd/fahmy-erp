'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Truck, Package, ShoppingCart,
  CreditCard, BarChart3, Bell, Settings, LogOut, Flame,
  ChevronLeft, Menu, X, Warehouse, Wallet
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
  { href: '/customers', icon: Users, label: 'العملاء' },
  { href: '/suppliers', icon: Truck, label: 'الموردون' },
  { href: '/inventory', icon: Package, label: 'المخزون' },
  { href: '/orders', icon: ShoppingCart, label: 'الطلبات' },
  { href: '/collections', icon: CreditCard, label: 'التحصيل' },
  { href: '/expenses', icon: Wallet, label: 'المصروفات' },
  { href: '/reports', icon: BarChart3, label: 'التقارير' },
  { href: '/notifications', icon: Bell, label: 'الإشعارات' },
  { href: '/settings', icon: Settings, label: 'الإعدادات' },
];

interface SidebarProps {
  notifCount?: number;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ notifCount = 0, mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={onMobileClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'sidebar',
          mobileOpen && 'mobile-open',
          collapsed && 'lg:![width:72px]'
        )}
        style={{ width: collapsed ? 72 : undefined }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 mb-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
            <Flame size={18} color="#000" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="sidebar-logo-text"
            >
              <div style={{ fontSize: '0.95rem', fontWeight: 800, lineHeight: 1.2, color: 'var(--text-primary)' }}>فحم</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>نظام إدارة التوزيع</div>
            </motion.div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2" style={{ overflowX: 'hidden' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            const showBadge = item.href === '/notifications' && notifCount > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn('sidebar-nav-item', isActive && 'active')}
                onClick={onMobileClose}
              >
                <div className="relative flex-shrink-0">
                  <Icon size={20} className="nav-icon" />
                  {showBadge && (
                    <span className="notif-badge">{notifCount > 9 ? '9+' : notifCount}</span>
                  )}
                </div>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--color-border)', padding: '12px 8px' }}>
          <button
            onClick={handleLogout}
            className="sidebar-nav-item w-full"
            style={{ color: 'var(--color-danger)', width: '100%' }}
          >
            <LogOut size={18} />
            {!collapsed && <span>تسجيل الخروج</span>}
          </button>
        </div>

        {/* Collapse Toggle (desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -left-3 top-20 w-6 h-6 rounded-full items-center justify-center cursor-pointer"
          style={{ background: 'var(--color-surface-3)', border: '1px solid var(--color-border)' }}
        >
          <ChevronLeft size={12} style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s', color: 'var(--text-secondary)' }} />
        </button>
      </aside>
    </>
  );
}
