'use client';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  ComposedChart, Line, Legend
} from 'recharts';
import { motion } from 'framer-motion';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

function ChartCard({ title, subtitle, children, className }: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`glass-card p-5 ${className ?? ''}`}
    >
      <div style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
        {subtitle && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 3 }}>{subtitle}</p>}
      </div>
      {children}
    </motion.div>
  );
}

const tooltipStyle = {
  backgroundColor: 'var(--color-surface-2)',
  border: '1px solid var(--color-border)',
  borderRadius: '10px',
  color: 'var(--text-primary)',
  fontFamily: 'Cairo, sans-serif',
  fontSize: '0.82rem',
};

// ─── Daily Sales Chart ────────────────────────────────────────────────────────

interface SalesChartProps {
  data: { date: string; value: number }[];
}

export function DailySalesChart({ data }: SalesChartProps) {
  return (
    <ChartCard title="المبيعات اليومية" subtitle="آخر 7 أيام">
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'Cairo' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v.toLocaleString('ar-EG')} ج`, 'المبيعات']} />
          <Area type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2.5} fill="url(#salesGrad)" dot={false} activeDot={{ r: 5, fill: '#f59e0b' }} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Monthly Profit Chart ─────────────────────────────────────────────────────

interface MonthlyChartProps {
  data: { date: string; value: number }[];
}

export function MonthlyProfitChart({ data }: MonthlyChartProps) {
  return (
    <ChartCard title="الأرباح الشهرية" subtitle="آخر 6 أشهر">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.4} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'Cairo' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v.toLocaleString('ar-EG')} ج`, 'الربح']} />
          <Bar dataKey="value" fill="url(#profitGrad)" radius={[6, 6, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Cash Flow Chart ──────────────────────────────────────────────────────────

interface CashFlowProps {
  data: { date: string; revenue: number; expenses: number }[];
}

export function CashFlowChart({ data }: CashFlowProps) {
  return (
    <ChartCard title="التدفق النقدي" subtitle="الإيرادات والمصروفات">
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'Cairo' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: any, name: any) => [`${v.toLocaleString('ar-EG')} ج`, name === 'revenue' ? 'الإيرادات' : 'المصروفات']} />
          <Legend formatter={(v) => v === 'revenue' ? 'الإيرادات' : 'المصروفات'} wrapperStyle={{ fontFamily: 'Cairo', fontSize: 12, color: 'var(--text-secondary)' }} />
          <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revGrad)" dot={false} />
          <Line type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} dot={false} strokeDasharray="4 2" />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Top Customers Bar Chart ──────────────────────────────────────────────────

interface TopCustomersChartProps {
  data: { name: string; value: number }[];
}

export function TopCustomersChart({ data }: TopCustomersChartProps) {
  return (
    <ChartCard title="أفضل العملاء" subtitle="حسب إجمالي المشتريات">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 5, left: 60, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
          <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: 'Cairo' }} axisLine={false} tickLine={false} width={80} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v.toLocaleString('ar-EG')} ج`, 'المشتريات']} />
          <Bar dataKey="value" fill="#f59e0b" radius={[0, 6, 6, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Charcoal Types Pie Chart ─────────────────────────────────────────────────

interface CharcoalTypesPieProps {
  data: { name: string; value: number; color: string }[];
}

export function CharcoalTypesPieChart({ data }: CharcoalTypesPieProps) {
  return (
    <ChartCard title="توزيع أنواع الفحم" subtitle="نسبة المبيعات لكل نوع">
      <div className="flex items-center gap-4">
        <ResponsiveContainer width="60%" height={180}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}%`, 'النسبة']} />
          </PieChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex flex-col gap-2 flex-1">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.name}</span>
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}
