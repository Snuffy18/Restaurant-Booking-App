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

/** Light palette (default product look) */
export const lightColors: AppColors = {
  primary: '#1D9E75',
  primaryMuted: '#E8F7F2',
  ai: '#534AB7',
  aiMuted: '#EDEAF9',
  background: '#F4F5F7',
  card: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  danger: '#DC2626',
  dangerMuted: '#FEE2E2',
  success: '#1D9E75',
  warning: '#F59E0B',
  overlay: 'rgba(0,0,0,0.45)',
  inputBg: '#F4F5F7',
  aiBorder: '#D4CFF5',
  chipMuted: '#F3F4F6',
  badgeScrim: 'rgba(17,24,39,0.75)',
};

/** Dark palette — keeps green primary + purple AI accents */
export const darkColors: AppColors = {
  primary: '#2EB88A',
  primaryMuted: '#123D30',
  ai: '#8B7FF0',
  aiMuted: '#252038',
  background: '#0C0E12',
  card: '#161B26',
  text: '#F3F4F6',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  border: '#2D3548',
  danger: '#F87171',
  dangerMuted: '#3F2426',
  success: '#2EB88A',
  warning: '#FBBF24',
  overlay: 'rgba(0,0,0,0.65)',
  inputBg: '#1F2636',
  aiBorder: '#3D3558',
  chipMuted: '#252B38',
  badgeScrim: 'rgba(0,0,0,0.72)',
};

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
