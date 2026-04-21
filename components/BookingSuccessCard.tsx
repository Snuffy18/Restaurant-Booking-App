import { ReactNode, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppColors } from '@/constants/Theme';
import { Radius, Spacing } from '@/constants/Theme';

type BookingSuccessCardProps = {
  colors: AppColors;
  compact?: boolean;
  title?: string;
  description?: string;
  icon?: string;
  iconElement?: ReactNode;
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    header: {
      backgroundColor: c.primary,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    check: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.md,
    },
    checkMark: { color: '#fff', fontSize: 28, fontWeight: '900' },
    headerTitle: { color: '#fff', fontSize: 24, fontWeight: '900', marginBottom: 6 },
    headerSub: { color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 20 },
  });
}

export function BookingSuccessCard({
  colors,
  compact = false,
  title = 'You’re booked',
  description = 'Show this QR at the host stand — we’ll seat you right away.',
  icon = '✓',
  iconElement,
}: BookingSuccessCardProps) {
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.header, compact && { borderRadius: Radius.md, padding: Spacing.md, marginBottom: 0 }]}>
      <View style={[styles.check, compact && { width: 40, height: 40, borderRadius: 20, marginBottom: Spacing.sm }]}>
        {iconElement ?? <Text style={[styles.checkMark, compact && { fontSize: 20 }]}>{icon}</Text>}
      </View>
      <Text style={[styles.headerTitle, compact && { fontSize: 19, marginBottom: 4 }]}>{title}</Text>
      <Text style={[styles.headerSub, compact && { fontSize: 13, lineHeight: 18 }]}>{description}</Text>
    </View>
  );
}
