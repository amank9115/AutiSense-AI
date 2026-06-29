import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'parent' | 'doctor';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  // Doctor-specific profile fields — optional; populated only for doctor accounts.
  phone?: string;
  specialization?: string;
  licenseNumber?: string;
  hospital?: string;
  yearsExperience?: number;
};

export type MlResults = {
  riskScore: number;
  riskLabel: string;
  modelVersion: string;
  summary: Record<string, number>;
  recommendations: string[];
};

export type AccessibilitySettings = {
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'normal' | 'large' | 'xlarge';
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

  // Accessibility state
  accessibility: AccessibilitySettings;
  setAccessibility: (settings: Partial<AccessibilitySettings>) => void;
  toggleHighContrast: () => void;

  // Sidebar state
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

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
      sidebarCollapsed: false,
      accessibility: {
        highContrast: false,
        reducedMotion: false,
        fontSize: 'normal',
      },

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

      // Accessibility actions
      setAccessibility: (settings) =>
        set((state) => ({
          accessibility: { ...state.accessibility, ...settings },
        })),
      toggleHighContrast: () =>
        set((state) => ({
          accessibility: { ...state.accessibility, highContrast: !state.accessibility.highContrast },
        })),

      // Sidebar actions
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      // Screening results actions
      setMlResults: (results) => set({ mlResults: results }),
      clearMlResults: () => set({ mlResults: null }),
    }),
    {
      name: 'autisense-storage',
      partialize: (state) => ({
        user: state.user,
        isGuest: state.isGuest,
        theme: state.theme,
        accessibility: state.accessibility,
      }),
    }
  )
);
