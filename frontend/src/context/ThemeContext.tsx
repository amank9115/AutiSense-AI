import { useAppStore } from '../store';

export const useTheme = () => {
  const theme = useAppStore(state => state.theme);
  const toggleTheme = useAppStore(state => state.toggleTheme);

  return { theme, toggleTheme };
};

// We export an empty provider so existing code doesn't break
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};
