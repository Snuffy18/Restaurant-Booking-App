import { StyleSheet, View } from 'react-native';

import { Theme } from '@/constants/Theme';

type Props = {
  total: number;
  activeIndex: number;
};

export function OnboardingProgress({ total, activeIndex }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, i) => {
        const active = i === activeIndex;
        return <View key={i} style={[styles.dot, active && styles.dotActive]} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  dot: {
    height: 6,
    width: 6,
    borderRadius: 3,
    backgroundColor: Theme.border,
  },
  dotActive: {
    width: 28,
    borderRadius: 4,
    backgroundColor: Theme.primary,
  },
});
