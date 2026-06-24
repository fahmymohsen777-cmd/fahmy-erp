'use client';
import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/store/authStore';

const pageTitles: Record<string, { title: string; subtitle?: string }> = {
  '/dashboard': { title: 'لوحة التحكم', subtitle: 'مرحباً بك في نظام فحم' },
  '/customers': { title: 'العملاء', subtitle: 'إدارة عملاء الكافيهات والمحلات' },
  '/suppliers': { title: 'الموردون', subtitle: 'إدارة موردي الفحم' },
  '/inventory': { title: 'المخزون', subtitle: 'إدارة مخزون المستودع' },
  '/orders': { title: 'الطلبات', subtitle: 'إدارة طلبات التوصيل' },
  '/collections': { title: 'التحصيل', subtitle: 'تتبع المدفوعات والتحصيل' },
  '/expenses': { title: 'المصروفات', subtitle: 'إدارة المصروفات التشغيلية والنثريات' },
  '/reports': { title: 'التقارير', subtitle: 'تقارير الأداء والأرباح' },
  '/notifications': { title: 'الإشعارات', subtitle: 'تنبيهات ومتابعة النظام' },
  '/settings': { title: 'الإعدادات', subtitle: 'إعدادات النظام والمستخدمين' },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const unreadNotifs = 0; // Will be implemented with real notifications later
  const { fetchUser } = useAuth();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const pageKey = Object.keys(pageTitles).find(k => pathname === k || pathname.startsWith(k + '/')) || '/dashboard';
  const pageInfo = pageTitles[pageKey] || { title: 'فحم' };

  return (
    <div className="dashboard-layout">
      <Sidebar
        notifCount={unreadNotifs}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="main-content">
        <Topbar
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
          notifCount={unreadNotifs}
          onMobileMenuOpen={() => setMobileOpen(true)}
        />
        <main className="page-container">
          {children}
        </main>
      </div>
    </div>
  );
}
