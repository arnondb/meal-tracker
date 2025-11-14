import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AuthUser, Family } from '@shared/types';
import { api } from '@/lib/api-client';
interface AuthState {
  user: AuthUser | null;
  token: string | null;
  family: Family | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  setInitialized: (isInitialized: boolean) => void;
  setFamily: (family: Family | null) => void;
  updateUser: (data: Partial<AuthUser>) => void;
  updateFamily: (data: Partial<Family>) => void;
}
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      family: null,
      isAuthenticated: false,
      isInitialized: false,
      setInitialized: (isInitialized) => set({ isInitialized }),
      login: async (token) => {
        set({ token, isAuthenticated: true });
        await get().checkAuth();
      },
      logout: () => {
        set({ user: null, token: null, family: null, isAuthenticated: false });
      },
      checkAuth: async () => {
        if (!get().token) {
          set({ isInitialized: true, isAuthenticated: false, user: null, family: null });
          return;
        }
        try {
          const data = await api<{ user: AuthUser; family: Family | null }>('/api/auth/me');
          set({
            user: data.user,
            family: data.family,
            isAuthenticated: true,
            isInitialized: true,
          });
        } catch (error) {
          console.error('Auth check failed, logging out.', error);
          set({ user: null, token: null, family: null, isAuthenticated: false, isInitialized: true });
        }
      },
      setFamily: (family) => {
        set({ family });
      },
      updateUser: (data) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        }));
      },
      updateFamily: (data) => {
        set((state) => ({
          family: state.family ? { ...state.family, ...data } : null,
        }));
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token }),
    }
  )
);