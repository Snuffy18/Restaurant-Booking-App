import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { darkColors, lightColors, type AppColors } from '@/constants/Theme';

const STORAGE_KEY = 'themePreference';

export type ThemePreference = 'system' | 'light' | 'dark';

type AppThemeContextValue = {
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => Promise<void>;
  resolvedScheme: 'light' | 'dark';
  colors: AppColors;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === 'light' || v === 'dark' || v === 'system') {
        setPreferenceState(v);
      }
    });
  }, []);

  const setPreference = useCallback(async (p: ThemePreference) => {
    setPreferenceState(p);
    await AsyncStorage.setItem(STORAGE_KEY, p);
  }, []);

  const resolvedScheme: 'light' | 'dark' =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  const colors = useMemo(
    () => (resolvedScheme === 'dark' ? darkColors : lightColors),
    [resolvedScheme],
  );

  const value = useMemo<AppThemeContextValue>(
    () => ({
      preference,
      setPreference,
      resolvedScheme,
      colors,
    }),
    [preference, setPreference, resolvedScheme, colors],
  );

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme(): AppThemeContextValue {
  const ctx = useContext(AppThemeContext);
  if (!ctx) {
    throw new Error('useAppTheme must be used within AppThemeProvider');
  }
  return ctx;
}
