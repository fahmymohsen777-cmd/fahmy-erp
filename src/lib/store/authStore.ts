import { create } from 'zustand';

interface AuthState {
  role: 'admin' | 'viewer' | null;
  username: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  fetchUser: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  role: null,
  username: null,
  isAuthenticated: false,
  isLoading: true,
  fetchUser: async () => {
    try {
      set({ isLoading: true });
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        set({ role: data.role, username: data.username, isAuthenticated: data.authenticated, isLoading: false });
      } else {
        set({ role: null, username: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      set({ role: null, username: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
