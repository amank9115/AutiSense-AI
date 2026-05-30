import React from 'react';
import { useAppStore } from '../store';

export type UserRole = "parent" | "doctor"

export const useAuth = () => {
  const user = useAppStore(state => state.user);
  const isGuest = useAppStore(state => state.isGuest);
  const login = useAppStore(state => state.setAuth);
  const updateUser = useAppStore(state => state.updateUser);
  const enterGuestMode = useAppStore(state => state.enterGuestMode);
  const logout = useAppStore(state => state.logout);

  return { user, isGuest, login, updateUser, enterGuestMode, logout };
};

// We export an empty provider so existing code doesn't break
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};
