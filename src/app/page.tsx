'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Flame, ArrowLeft, LayoutDashboard } from 'lucide-react';

export default function HomePage() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background orbs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{
          textAlign: 'center',
          maxWidth: 560,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{
            width: 96,
            height: 96,
            borderRadius: 28,
            background: 'linear-gradient(135deg, #f59e0b, #f97316)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 2rem',
            boxShadow: '0 20px 60px rgba(245,158,11,0.35)',
          }}
        >
          <Flame size={48} color="#000" strokeWidth={2} />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1.1, marginBottom: '1rem' }}
        >
          <span className="gradient-text">فحم</span>
          <br />
          <span style={{ color: 'var(--text-primary)' }}>ERP</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            fontSize: '1.1rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            marginBottom: '2.5rem',
          }}
        >
          نظام إدارة متكامل لتوزيع الفحم
          <br />
          العملاء · الموردين · المخزون · الطلبات · التقارير
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}
        >
          <Link
            href="/dashboard"
            className="btn-primary"
            style={{ fontSize: '1rem', padding: '0.875rem 2rem', gap: '0.625rem' }}
          >
            <LayoutDashboard size={20} />
            فتح لوحة التحكم
          </Link>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          style={{
            marginTop: '3rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
          }}
        >
          {[
            { icon: '📊', label: 'تقارير شاملة' },
            { icon: '📦', label: 'إدارة المخزون' },
            { icon: '💳', label: 'تتبع التحصيل' },
            { icon: '🚛', label: 'إدارة التوصيل' },
            { icon: '👥', label: 'إدارة العملاء' },
            { icon: '📱', label: 'تطبيق جوال' },
          ].map((f) => (
            <div
              key={f.label}
              style={{
                padding: '0.875rem',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 12,
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{f.icon}</div>
              {f.label}
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
