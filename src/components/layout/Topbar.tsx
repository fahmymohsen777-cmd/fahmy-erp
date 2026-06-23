'use client';
import { Bell, Search, Menu } from 'lucide-react';
import { useState } from 'react';

interface TopbarProps {
  title: string;
  subtitle?: string;
  notifCount?: number;
  onMobileMenuOpen?: () => void;
}

export function Topbar({ title, subtitle, notifCount = 0, onMobileMenuOpen }: TopbarProps) {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header className="topbar">
      {/* Mobile menu button */}
      <button
        className="btn-ghost lg:hidden"
        onClick={onMobileMenuOpen}
        style={{ padding: '0.5rem' }}
      >
        <Menu size={22} />
      </button>

      {/* Page title */}
      <div className="flex-1">
        <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</p>
        )}
      </div>

      {/* Search */}
      <div
        className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl transition-all"
        style={{
          background: searchFocused ? 'var(--color-surface-3)' : 'var(--color-surface-2)',
          border: `1px solid ${searchFocused ? 'var(--color-amber)' : 'var(--color-border)'}`,
          minWidth: 200,
          boxShadow: searchFocused ? '0 0 0 3px var(--color-amber-dim)' : 'none',
        }}
      >
        <Search size={15} style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="بحث..."
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          style={{
            background: 'none',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            fontFamily: 'inherit',
            width: '100%',
          }}
        />
      </div>

      {/* Notifications */}
      <button className="btn-ghost relative" style={{ padding: '0.5rem' }}>
        <Bell size={20} />
        {notifCount > 0 && (
          <span className="notif-badge">{notifCount > 9 ? '9+' : notifCount}</span>
        )}
      </button>

      {/* Avatar */}
      <div className="avatar cursor-pointer">أ</div>
    </header>
  );
}
