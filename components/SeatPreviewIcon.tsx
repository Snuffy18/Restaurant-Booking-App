import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import type { AppColors } from '@/constants/Theme';
import { useAppTheme } from '@/contexts/AppThemeContext';

type Props = {
  size?: number;
  muted?: boolean;
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    table: {},
    dot: {
      position: 'absolute',
      width: 5,
      height: 5,
      borderRadius: 2.5,
    },
    tl: { top: 4, left: 4 },
    tr: { top: 4, right: 4 },
    bl: { bottom: 4, left: 4 },
    br: { bottom: 4, right: 4 },
  });
}

/** Minimal dot grid suggesting seats around a table — design shorthand. */
export function SeatPreviewIcon({ size = 40, muted }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const dotColor = muted ? colors.textMuted : colors.textSecondary;
  const tableBg = muted ? colors.border : colors.aiMuted;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <View style={[styles.table, { backgroundColor: tableBg, width: '55%', height: '40%', borderRadius: 6 }]} />
      <View style={[styles.dot, styles.tl, { backgroundColor: dotColor }]} />
      <View style={[styles.dot, styles.tr, { backgroundColor: dotColor }]} />
      <View style={[styles.dot, styles.bl, { backgroundColor: dotColor }]} />
      <View style={[styles.dot, styles.br, { backgroundColor: dotColor }]} />
    </View>
  );
}
