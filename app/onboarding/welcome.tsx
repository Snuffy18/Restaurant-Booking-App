import { Link, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingProgress } from '@/components/OnboardingProgress';
import { Theme, Radius, Spacing } from '@/constants/Theme';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <OnboardingProgress total={5} activeIndex={0} />
      <View style={styles.body}>
        <Text style={styles.kicker}>Restaurant Seats</Text>
        <Text style={styles.title}>Pick your table. Book in seconds.</Text>
        <Text style={styles.sub}>
          Search restaurants, choose your exact seat from the floor plan, and let our assistant find the perfect spot for
          any occasion.
        </Text>
      </View>
      <View style={styles.footer}>
        <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]} onPress={() => router.push('/onboarding/account')}>
          <Text style={styles.primaryLabel}>Create account</Text>
        </Pressable>
        <Link href="/onboarding/account" asChild>
          <Pressable style={styles.linkBtn}>
            <Text style={styles.linkLabel}>I already have an account</Text>
          </Pressable>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.background },
  body: { flex: 1, paddingHorizontal: Spacing.lg, justifyContent: 'center' },
  kicker: { color: Theme.primary, fontWeight: '700', marginBottom: Spacing.sm, letterSpacing: 0.5 },
  title: { fontSize: 28, fontWeight: '800', color: Theme.text, marginBottom: Spacing.md, lineHeight: 34 },
  sub: { fontSize: 16, lineHeight: 24, color: Theme.textSecondary },
  footer: { padding: Spacing.lg, gap: Spacing.sm },
  primaryBtn: {
    backgroundColor: Theme.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  primaryLabel: { color: '#fff', fontSize: 17, fontWeight: '700' },
  linkBtn: { paddingVertical: Spacing.sm, alignItems: 'center' },
  linkLabel: { color: Theme.ai, fontWeight: '600', fontSize: 16 },
});
