import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'فحم — نظام إدارة التوزيع',
  description:
    'نظام ERP متكامل لإدارة توزيع الفحم — العملاء، الموردين، المخزون، الطلبات، التحصيل والتقارير',
  manifest: '/manifest.json',
  keywords: ['فحم', 'ERP', 'إدارة', 'توزيع', 'مخزون'],
  authors: [{ name: 'فحم' }],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'فهمي ERP',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#08080f',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&family=Tajawal:wght@300;400;500;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="animated-gradient" suppressHydrationWarning>
        <Toaster position="bottom-right" />
        {children}
      </body>
    </html>
  );
}
