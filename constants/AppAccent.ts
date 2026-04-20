/**
 * User accent = **primary** (buttons, tabs, highlights). Pick one of `ACCENT_HEX_OPTIONS`.
 * AI purple tokens stay fixed — see `AppAccentAI`.
 * `Theme.ts` builds light/dark palettes from the chosen hex; use `useAppTheme().colors`.
 */

export const ACCENT_HEX_OPTIONS = ['#ff7b00', '#0a2472', '#c9184a', '#d00000'] as const;
export type AccentHex = (typeof ACCENT_HEX_OPTIONS)[number];

export const DEFAULT_ACCENT_HEX: AccentHex = '#ff7b00';

export function isAccentHex(value: string | null | undefined): value is AccentHex {
  return value != null && (ACCENT_HEX_OPTIONS as readonly string[]).includes(value);
}

type PrimaryDerivatives = {
  primary: string;
  primaryOnDark: string;
  primaryMutedLight: string;
  primaryMutedDark: string;
};

/** Per-accent primary + companion surfaces for light/dark UI */
export const ACCENT_PRIMARY_BY_HEX: Record<AccentHex, PrimaryDerivatives> = {
  '#ff7b00': {
    primary: '#ff7b00',
    primaryOnDark: '#FFA64D',
    primaryMutedLight: '#FFF3E8',
    primaryMutedDark: '#3D2915',
  },
  '#0a2472': {
    primary: '#0a2472',
    primaryOnDark: '#6B9EFF',
    primaryMutedLight: '#E8EEF9',
    primaryMutedDark: '#142544',
  },
  '#c9184a': {
    primary: '#c9184a',
    primaryOnDark: '#F0668B',
    primaryMutedLight: '#FCE8EF',
    primaryMutedDark: '#3D1824',
  },
  '#d00000': {
    primary: '#d00000',
    primaryOnDark: '#FF5252',
    primaryMutedLight: '#FDE8E8',
    primaryMutedDark: '#3D1515',
  },
};

/** Fixed AI assistant styling (not tied to user accent). */
export const AppAccentAI = {
  ai: '#534AB7',
  aiOnDark: '#8B7FF0',
  aiMutedLight: '#EDEAF9',
  aiMutedDark: '#252038',
  aiBorderLight: '#D4CFF5',
  aiBorderDark: '#3D3558',
} as const;

/** Default primary values for static imports / legacy `Theme` export */
export const AppAccent = {
  ...ACCENT_PRIMARY_BY_HEX[DEFAULT_ACCENT_HEX],
  ...AppAccentAI,
} as const;
