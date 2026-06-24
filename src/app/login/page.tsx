'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, User } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('تم تسجيل الدخول بنجاح');
        router.push('/dashboard');
        router.refresh();
      } else {
        toast.error(data.error || 'خطأ في تسجيل الدخول');
      }
    } catch (err) {
      toast.error('تعذر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-background)', padding: '1rem' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'var(--color-surface)',
          padding: '2.5rem',
          borderRadius: 20,
          border: '1px solid var(--color-border)',
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 60, height: 60, background: 'rgba(245, 158, 11, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
            <Lock color="var(--color-amber)" size={30} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>تسجيل الدخول</h1>
          <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem', marginTop: '0.5rem' }}>نظام فحم لإدارة وتتبع أعمالك</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-dim)' }}>اسم المستخدم</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-dim)' }} />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field" 
                style={{ paddingRight: '2.5rem', width: '100%', direction: 'ltr', textAlign: 'left' }}
                placeholder="admin"
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-dim)' }}>كلمة المرور</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-dim)' }} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field" 
                style={{ paddingRight: '2.5rem', width: '100%', direction: 'ltr', textAlign: 'left' }}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem', justifyContent: 'center' }}
          >
            {loading ? 'جاري الدخول...' : 'دخول'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
