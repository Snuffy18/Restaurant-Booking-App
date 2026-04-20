import { darkColors, lightColors } from './Theme';

/** Legacy shape for `Themed` / older components — maps to app palettes */
export default {
  light: {
    text: lightColors.text,
    background: lightColors.background,
    tint: lightColors.primary,
    tabIconDefault: lightColors.textMuted,
    tabIconSelected: lightColors.primary,
  },
  dark: {
    text: darkColors.text,
    background: darkColors.background,
    tint: darkColors.primary,
    tabIconDefault: darkColors.textMuted,
    tabIconSelected: darkColors.primary,
  },
};
