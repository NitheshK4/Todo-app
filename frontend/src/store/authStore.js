import { create } from 'zustand';
import api from '../api/axios';

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: true,

  init: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return set({ loading: false });
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.user, isAuthenticated: true, loading: false });
    } catch {
      localStorage.clear();
      set({ user: null, isAuthenticated: false, loading: false });
    }
  },

  login: (user, accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.clear();
    set({ user: null, isAuthenticated: false });
  },

  updateUser: (updates) => set((s) => ({ user: { ...s.user, ...updates } })),
}));

export default useAuthStore;
