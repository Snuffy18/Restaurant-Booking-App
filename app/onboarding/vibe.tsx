import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingProgress } from '@/components/OnboardingProgress';
import { Theme, Radius, Spacing } from '@/constants/Theme';

const OPTIONS = ['Romantic', 'Family', 'Business', 'Casual', 'Outdoor', 'Lively'];

export default function VibeScreen() {
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.background },
  header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  title: { fontSize: 24, fontWeight: '800', color: Theme.text, marginBottom: Spacing.sm },
  sub: { fontSize: 15, lineHeight: 22, color: Theme.textSecondary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, paddingHorizontal: Spacing.lg },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Theme.border,
    backgroundColor: Theme.card,
  },
  chipOn: { borderColor: Theme.primary, backgroundColor: Theme.primaryMuted },
  chipText: { fontWeight: '600', color: Theme.text },
  chipTextOn: { color: Theme.primary },
  footer: { padding: Spacing.lg, gap: Spacing.sm },
  primaryBtn: {
    backgroundColor: Theme.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  primaryLabel: { color: '#fff', fontSize: 17, fontWeight: '700' },
  skip: { alignItems: 'center', paddingVertical: Spacing.sm },
  skipText: { color: Theme.textSecondary, fontWeight: '600' },
});
