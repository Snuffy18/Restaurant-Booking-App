import { StyleSheet, View } from 'react-native';

import { Theme } from '@/constants/Theme';

type Props = {
  size?: number;
  muted?: boolean;
};

/** Minimal dot grid suggesting seats around a table — design shorthand. */
export function SeatPreviewIcon({ size = 40, muted }: Props) {
  const dotColor = muted ? Theme.textMuted : Theme.textSecondary;
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <View style={[styles.table, { backgroundColor: muted ? Theme.border : Theme.aiMuted }]} />
      <View style={[styles.dot, styles.tl, { backgroundColor: dotColor }]} />
      <View style={[styles.dot, styles.tr, { backgroundColor: dotColor }]} />
      <View style={[styles.dot, styles.bl, { backgroundColor: dotColor }]} />
      <View style={[styles.dot, styles.br, { backgroundColor: dotColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  table: {
    width: '55%',
    height: '40%',
    borderRadius: 6,
  },
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
