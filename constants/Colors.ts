import { Theme } from './Theme';

const tintColorLight = Theme.primary;
const tintColorDark = Theme.primary;

export default {
  light: {
    text: Theme.text,
    background: Theme.background,
    tint: tintColorLight,
    tabIconDefault: '#9CA3AF',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
  },
};
