import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingProgress } from '@/components/OnboardingProgress';
import { Theme, Radius, Spacing } from '@/constants/Theme';

export default function AccountScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <SafeAreaView style={styles.safe}>
      <OnboardingProgress total={5} activeIndex={1} />
      <View style={styles.header}>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.sub}>Use email or continue with Google — SSO wiring hooks up to your auth provider.</Text>
      </View>
      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor={Theme.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor={Theme.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Pressable style={({ pressed }) => [styles.google, pressed && { opacity: 0.92 }]}>
          <Text style={styles.googleLabel}>Continue with Google</Text>
        </Pressable>
      </View>
      <View style={styles.footer}>
        <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]} onPress={() => router.push('/onboarding/cuisine')}>
          <Text style={styles.primaryLabel}>Continue</Text>
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
  form: { paddingHorizontal: Spacing.lg, gap: Spacing.sm, flex: 1 },
  label: { fontSize: 13, fontWeight: '600', color: Theme.textSecondary, marginTop: Spacing.xs },
  input: {
    backgroundColor: Theme.card,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    color: Theme.text,
  },
  google: {
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Theme.border,
    backgroundColor: Theme.card,
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  googleLabel: { fontWeight: '600', color: Theme.text },
  footer: { padding: Spacing.lg },
  primaryBtn: {
    backgroundColor: Theme.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  primaryLabel: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
