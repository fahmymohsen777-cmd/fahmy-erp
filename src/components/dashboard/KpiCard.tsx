'use client';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
  iconBg?: string;
  trend?: number;
  trendLabel?: string;
  index?: number;
  accent?: string;
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon,
  iconBg = 'var(--color-amber-dim)',
  trend,
  trendLabel,
  index = 0,
  accent = 'var(--color-amber)',
}: KpiCardProps) {
  const hasTrend = trend !== undefined;
  const isPositive = hasTrend && trend >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: 'easeOut' }}
      className="kpi-card"
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg }}
        >
          {icon}
        </div>
        {hasTrend && (
          <span className={isPositive ? 'stat-badge-up' : 'stat-badge-down'}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>

      {/* Value */}
      <div style={{ marginBottom: 6 }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.07 + 0.2 }}
          style={{
            fontSize: '1.65rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            lineHeight: 1.1,
          }}
        >
          {value}
        </motion.div>
      </div>

      {/* Title */}
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
        {title}
      </div>

      {/* Subtitle / Trend label */}
      {(subtitle || trendLabel) && (
        <div
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            marginTop: 4,
          }}
        >
          {trendLabel || subtitle}
        </div>
      )}

      {/* Accent bottom line */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          left: 0,
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          opacity: 0.6,
          borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
        }}
      />
    </motion.div>
  );
}
