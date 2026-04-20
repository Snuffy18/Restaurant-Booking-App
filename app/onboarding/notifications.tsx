import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingProgress } from '@/components/OnboardingProgress';
import type { AppColors } from '@/constants/Theme';
import { Radius, Spacing } from '@/constants/Theme';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { setOnboardingComplete } from '@/lib/onboardingStorage';

type Choice = 'all' | 'reminders' | 'not_now';

function createStyles(c: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
    title: { fontSize: 24, fontWeight: '800', color: c.text, marginBottom: Spacing.sm },
    sub: { fontSize: 15, lineHeight: 22, color: c.textSecondary },
    options: { paddingHorizontal: Spacing.lg, gap: Spacing.sm, flex: 1 },
    row: {
      flexDirection: 'row',
      gap: Spacing.md,
      padding: Spacing.md,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      alignItems: 'flex-start',
    },
    rowOn: { borderColor: c.primary, backgroundColor: c.primaryMuted },
    radioOuter: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    radioOuterOn: { borderColor: c.primary },
    radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: c.primary },
    rowTitle: { fontWeight: '700', color: c.text, fontSize: 16 },
    rowSub: { color: c.textSecondary, marginTop: 4, lineHeight: 20 },
    footer: { padding: Spacing.lg },
    primaryBtn: {
      backgroundColor: c.primary,
      paddingVertical: Spacing.md,
      borderRadius: Radius.md,
      alignItems: 'center',
    },
    primaryLabel: { color: '#fff', fontSize: 17, fontWeight: '700' },
  });
}

type NotifStyles = ReturnType<typeof createStyles>;

function RadioRow({
  label,
  description,
  selected,
  onPress,
  styles,
}: {
  label: string;
  description: string;
  selected: boolean;
  onPress: () => void;
  styles: NotifStyles;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.row, selected && styles.rowOn]}>
      <View style={[styles.radioOuter, selected && styles.radioOuterOn]}>{selected ? <View style={styles.radioInner} /> : null}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{label}</Text>
        <Text style={styles.rowSub}>{description}</Text>
      </View>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [choice, setChoice] = useState<Choice>('reminders');

  const finish = async () => {
    await setOnboardingComplete(true);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <OnboardingProgress total={5} activeIndex={4} />
      <View style={styles.header}>
        <Text style={styles.title}>Stay in the loop</Text>
        <Text style={styles.sub}>Choose how we reach you about bookings and offers.</Text>
      </View>
      <View style={styles.options}>
        <RadioRow
          label="All notifications"
          description="Reminders, confirmations, and tips"
          selected={choice === 'all'}
          onPress={() => setChoice('all')}
          styles={styles}
        />
        <RadioRow
          label="Reminders only"
          description="Booking reminders — nothing promotional"
          selected={choice === 'reminders'}
          onPress={() => setChoice('reminders')}
          styles={styles}
        />
        <RadioRow
          label="Not now"
          description="You can change this anytime in settings"
          selected={choice === 'not_now'}
          onPress={() => setChoice('not_now')}
          styles={styles}
        />
      </View>
      <View style={styles.footer}>
        <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]} onPress={finish}>
          <Text style={styles.primaryLabel}>Get started</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
