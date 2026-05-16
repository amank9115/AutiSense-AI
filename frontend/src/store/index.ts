import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'parent' | 'doctor';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type MlResults = {
  riskScore: number;
  riskLabel: string;
  modelVersion: string;
  summary: Record<string, number>;
  recommendations: string[];
};

interface AppState {
  // Auth state
  user: User | null;
  token: string | null;
  isGuest: boolean;

  // Auth actions
  setAuth: (user: User, token: string) => void;
  updateUser: (user: User) => void;
  enterGuestMode: () => void;
  logout: () => void;

  // UI/Theme state
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;

  // Screening results
  mlResults: MlResults | null;
  setMlResults: (results: MlResults | null) => void;
  clearMlResults: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      token: null,
      isGuest: false,
      theme: 'light',
      mlResults: null,

      // Auth actions
      setAuth: (user, token) => set({ user, token, isGuest: false }),
      updateUser: (user) => set({ user }),
      enterGuestMode: () => set({
        user: { id: 'guest', name: 'Guest User', email: 'guest@autisense.ai', role: 'parent' },
        token: 'guest-token',
        isGuest: true,
      }),
      logout: () => set({ user: null, token: null, isGuest: false }),

      // Theme actions
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      setTheme: (theme) => set({ theme }),

      // Screening results actions
      setMlResults: (results) => set({ mlResults: results }),
      clearMlResults: () => set({ mlResults: null }),
    }),
    {
      name: 'autisense-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isGuest: state.isGuest,
        theme: state.theme,
      }),
    }
  )
);
