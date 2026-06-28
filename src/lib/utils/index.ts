import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CharcoalType, OrderStatus } from '@/lib/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'EGP', locale = 'ar-EG'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number, locale = 'ar-EG'): string {
  return new Intl.NumberFormat(locale).format(num);
}

export function formatDate(date: string | Date, locale = 'ar-EG'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatShortDate(date: string | Date): string {
  return new Intl.DateTimeFormat('ar-EG', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function getCharcoalTypeLabel(type: CharcoalType): string {
  const labels: Record<CharcoalType, string> = {
    orange: 'برتقال',
    lemon: 'ليمون',
    guava: 'جوافة',
    mango: 'مانجو',
    mixed: 'مشكل',
  };
  return labels[type];
}

export function getCharcoalTypeColor(type: CharcoalType): string {
  const colors: Record<CharcoalType, string> = {
    orange: '#F97316',
    lemon: '#EAB308',
    guava: '#22C55E',
    mango: '#A855F7',
    mixed: '#6B7280',
  };
  return colors[type];
}

export function getOrderStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    pending: 'معلق',
    in_delivery: 'جاري التوصيل',
    delivered: 'تم التسليم',
    collected: 'تم التحصيل',
  };
  return labels[status];
}

export function getOrderStatusColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    pending: '#F59E0B',
    in_delivery: '#3B82F6',
    delivered: '#10B981',
    collected: '#8B5CF6',
  };
  return colors[status];
}

export function calculateGrowthPct(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `ORD-${year}${month}${day}-${random}`;
}

export function getDaysSince(date: string | Date): number {
  const now = new Date();
  const target = new Date(date);
  const diff = now.getTime() - target.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
