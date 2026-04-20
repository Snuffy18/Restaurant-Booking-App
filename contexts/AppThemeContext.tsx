import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import {
  DEFAULT_ACCENT_HEX,
  isAccentHex,
  type AccentHex,
} from '@/constants/AppAccent';
import { createDarkColors, createLightColors, type AppColors } from '@/constants/Theme';

const THEME_PREF_KEY = 'themePreference';
const ACCENT_PREF_KEY = 'accentHexPreference';

export type ThemePreference = 'system' | 'light' | 'dark';

type AppThemeContextValue = {
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => Promise<void>;
  resolvedScheme: 'light' | 'dark';
  accentHex: AccentHex;
  setAccentHex: (hex: AccentHex) => Promise<void>;
  colors: AppColors;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [accentHex, setAccentHexState] = useState<AccentHex>(DEFAULT_ACCENT_HEX);

  useEffect(() => {
    AsyncStorage.getItem(THEME_PREF_KEY).then((v) => {
      if (v === 'light' || v === 'dark' || v === 'system') {
        setPreferenceState(v);
      }
    });
    AsyncStorage.getItem(ACCENT_PREF_KEY).then((v) => {
      if (isAccentHex(v)) {
        setAccentHexState(v);
      }
    });
  }, []);

  const setPreference = useCallback(async (p: ThemePreference) => {
    setPreferenceState(p);
    await AsyncStorage.setItem(THEME_PREF_KEY, p);
  }, []);

  const setAccentHex = useCallback(async (hex: AccentHex) => {
    setAccentHexState(hex);
    await AsyncStorage.setItem(ACCENT_PREF_KEY, hex);
  }, []);

  const resolvedScheme: 'light' | 'dark' =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  const colors = useMemo(
    () =>
      resolvedScheme === 'dark' ? createDarkColors(accentHex) : createLightColors(accentHex),
    [resolvedScheme, accentHex],
  );

  const value = useMemo<AppThemeContextValue>(
    () => ({
      preference,
      setPreference,
      resolvedScheme,
      accentHex,
      setAccentHex,
      colors,
    }),
    [preference, setPreference, resolvedScheme, accentHex, setAccentHex, colors],
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

export type { AccentHex } from '@/constants/AppAccent';
