import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import type { AppColors } from '@/constants/Theme';
import { useAppTheme } from '@/contexts/AppThemeContext';

type Props = {
  total: number;
  activeIndex: number;
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
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
      backgroundColor: c.border,
    },
    dotActive: {
      width: 28,
      borderRadius: 4,
      backgroundColor: c.primary,
    },
  });
}

export function OnboardingProgress({ total, activeIndex }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, i) => {
        const active = i === activeIndex;
        return <View key={i} style={[styles.dot, active && styles.dotActive]} />;
      })}
    </View>
  );
}
