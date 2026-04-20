import {
  ACCENT_PRIMARY_BY_HEX,
  AppAccentAI,
  DEFAULT_ACCENT_HEX,
  type AccentHex,
} from './AppAccent';

export type AppColors = {
  primary: string;
  primaryMuted: string;
  ai: string;
  aiMuted: string;
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  danger: string;
  /** Light red surface (cancelled badge, etc.) */
  dangerMuted: string;
  success: string;
  warning: string;
  overlay: string;
  /** Inputs / nested chips on top of card */
  inputBg: string;
  aiBorder: string;
  /** Muted pill (e.g. “Full tonight”) */
  chipMuted: string;
  /** Dark scrim on images */
  badgeScrim: string;
};

const LIGHT_BASE = {
  background: '#F4F5F7',
  card: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  danger: '#DC2626',
  dangerMuted: '#FEE2E2',
  warning: '#F59E0B',
  overlay: 'rgba(0,0,0,0.45)',
  inputBg: '#F4F5F7',
  chipMuted: '#F3F4F6',
  badgeScrim: 'rgba(17,24,39,0.75)',
} as const;

const DARK_BASE = {
  background: '#0C0E12',
  card: '#161B26',
  text: '#F3F4F6',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  border: '#2D3548',
  danger: '#F87171',
  dangerMuted: '#3F2426',
  warning: '#FBBF24',
  overlay: 'rgba(0,0,0,0.65)',
  inputBg: '#1F2636',
  chipMuted: '#252B38',
  badgeScrim: 'rgba(0,0,0,0.72)',
} as const;

export function createLightColors(accentHex: AccentHex): AppColors {
  const p = ACCENT_PRIMARY_BY_HEX[accentHex];
  return {
    ...LIGHT_BASE,
    primary: p.primary,
    primaryMuted: p.primaryMutedLight,
    success: p.primary,
    ai: AppAccentAI.ai,
    aiMuted: AppAccentAI.aiMutedLight,
    aiBorder: AppAccentAI.aiBorderLight,
  };
}

export function createDarkColors(accentHex: AccentHex): AppColors {
  const p = ACCENT_PRIMARY_BY_HEX[accentHex];
  return {
    ...DARK_BASE,
    primary: p.primaryOnDark,
    primaryMuted: p.primaryMutedDark,
    success: p.primaryOnDark,
    ai: AppAccentAI.aiOnDark,
    aiMuted: AppAccentAI.aiMutedDark,
    aiBorder: AppAccentAI.aiBorderDark,
  };
}

/** Default light palette (static imports, legacy `Colors.ts`) */
export const lightColors: AppColors = createLightColors(DEFAULT_ACCENT_HEX);

/** Default dark palette */
export const darkColors: AppColors = createDarkColors(DEFAULT_ACCENT_HEX);

/** @deprecated use useAppTheme().colors */
export const Theme = lightColors;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
} as const;

/** Registered in `app/_layout.tsx` via expo-font. */
export const FontFamily = {
  bebasNeue: 'BebasNeue',
  /** Static Black (900) for maximum weight in RN. */
  nunitoSans: 'NunitoSans_900Black',
} as const;

export { AppAccent, DEFAULT_ACCENT_HEX, type AccentHex } from './AppAccent';
