import { useColorScheme } from 'react-native';

const lightColors = {
  background: '#ffffff',
  backgroundMuted: '#f9fafb',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  accent: '#2563eb',
  accentContrast: '#ffffff',
  destructive: '#ef4444',
  destructiveContrast: '#ffffff',
  border: '#e5e7eb',
  borderStrong: '#d1d5db',
  inputBackground: '#ffffff',
  overlayBackground: 'rgba(0,0,0,0.55)',
  overlayTextPrimary: '#ffffff',
  overlayTextSecondary: '#f3f4f6',
  modalBackdrop: 'rgba(0,0,0,0.3)',
  modalBackground: '#ffffff',
  buttonGhostBackground: '#ffffff',
  buttonGhostBorder: '#d1d5db',
  buttonGhostText: '#374151',
  tabBarBackground: '#ffffff',
  tabBarBorder: '#e5e7eb',
  tabBarActive: '#2563eb',
  tabBarInactive: '#9ca3af',
  headerBackground: '#ffffff',
  headerTint: '#111827',
  surface: '#ffffff',
  surfaceAlt: '#f1f5f9',
};

const darkColors: typeof lightColors = {
  background: '#0f172a',
  backgroundMuted: '#111827',
  textPrimary: '#f8fafc',
  textSecondary: '#cbd5f5',
  textMuted: '#94a3b8',
  accent: '#60a5fa',
  accentContrast: '#0f172a',
  destructive: '#f87171',
  destructiveContrast: '#ffffff',
  border: '#1f2937',
  borderStrong: '#334155',
  inputBackground: '#1f2937',
  overlayBackground: 'rgba(15,23,42,0.8)',
  overlayTextPrimary: '#f8fafc',
  overlayTextSecondary: '#e2e8f0',
  modalBackdrop: 'rgba(15,23,42,0.7)',
  modalBackground: '#1f2937',
  buttonGhostBackground: '#1f2937',
  buttonGhostBorder: '#334155',
  buttonGhostText: '#e2e8f0',
  tabBarBackground: '#111827',
  tabBarBorder: '#1f2937',
  tabBarActive: '#60a5fa',
  tabBarInactive: '#475569',
  headerBackground: '#111827',
  headerTint: '#f8fafc',
  surface: '#1f2937',
  surfaceAlt: '#1e293b',
};

export type ThemeColors = typeof lightColors;

export const useThemeColors = (): ThemeColors => {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkColors : lightColors;
};

export const useIsDarkMode = (): boolean => {
  const scheme = useColorScheme();
  return scheme === 'dark';
};
