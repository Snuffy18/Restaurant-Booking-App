import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingProgress } from '@/components/OnboardingProgress';
import type { AppColors } from '@/constants/Theme';
import { Radius, Spacing } from '@/constants/Theme';
import { useAppTheme } from '@/contexts/AppThemeContext';

const OPTIONS = ['Romantic', 'Family', 'Business', 'Casual', 'Outdoor', 'Lively'];

function createStyles(c: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
    title: { fontSize: 24, fontWeight: '800', color: c.text, marginBottom: Spacing.sm },
    sub: { fontSize: 15, lineHeight: 22, color: c.textSecondary },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, paddingHorizontal: Spacing.lg },
    chip: {
      paddingHorizontal: Spacing.md,
      paddingVertical: 12,
      borderRadius: Radius.full,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
    },
    chipOn: { borderColor: c.primary, backgroundColor: c.primaryMuted },
    chipText: { fontWeight: '600', color: c.text },
    chipTextOn: { color: c.primary },
    footer: { padding: Spacing.lg, gap: Spacing.sm },
    primaryBtn: {
      backgroundColor: c.primary,
      paddingVertical: Spacing.md,
      borderRadius: Radius.md,
      alignItems: 'center',
    },
    primaryLabel: { color: '#fff', fontSize: 17, fontWeight: '700' },
    skip: { alignItems: 'center', paddingVertical: Spacing.sm },
    skipText: { color: c.textSecondary, fontWeight: '600' },
  });
}

export default function VibeScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (o: string) => {
    setSelected((prev) => (prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o]));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <OnboardingProgress total={5} activeIndex={3} />
      <View style={styles.header}>
        <Text style={styles.title}>What’s your dining vibe?</Text>
        <Text style={styles.sub}>We’ll match seats and restaurants to the mood you want.</Text>
      </View>
      <ScrollView contentContainerStyle={styles.chips} showsVerticalScrollIndicator={false}>
        {OPTIONS.map((o) => {
          const on = selected.includes(o);
          return (
            <Pressable key={o} onPress={() => toggle(o)} style={[styles.chip, on && styles.chipOn]}>
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{o}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.footer}>
        <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]} onPress={() => router.push('/onboarding/notifications')}>
          <Text style={styles.primaryLabel}>Continue</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/onboarding/notifications')} style={styles.skip}>
          <Text style={styles.skipText}>Skip for now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
