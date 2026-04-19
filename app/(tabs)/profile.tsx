import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Theme, Radius, Spacing } from '@/constants/Theme';
import { MOCK_USER } from '@/data/mockData';
import { setOnboardingComplete } from '@/lib/onboardingStorage';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{MOCK_USER.firstName.slice(0, 1)}</Text>
          </View>
          <Text style={styles.name}>{MOCK_USER.firstName} Example</Text>
          <Text style={styles.email}>{MOCK_USER.email}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Member</Text>
          </View>
        </View>

        <View style={styles.stats}>
          <Stat label="Bookings" value="12" />
          <Stat label="Visited" value="8" />
          <Stat label="Reviews" value="3" />
        </View>

        <Section title="Preferences">
          <Row label="Cuisine preferences" value="Italian, Japanese" />
          <Row label="Dining vibe" value="Romantic, Casual" />
          <Row label="Dietary requirements" value="None set" last />
        </Section>

        <Section title="Favourites">
          <Row label="Saved restaurants" value="4 places" />
          <Row label="My reviews" value="3" last />
        </Section>

        <Section title="Notifications">
          <ToggleRow label="Booking reminders" defaultOn />
          <ToggleRow label="Email confirmations" defaultOn />
          <ToggleRow label="Special offers" />
        </Section>

        <Section title="Account">
          <Row label="Change password" />
          <Row label="Privacy settings" />
          <Pressable
            style={styles.signOut}
            onPress={async () => {
              await setOnboardingComplete(false);
              router.replace('/');
            }}>
            <FontAwesome name="sign-out" size={18} color={Theme.danger} />
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        </Section>

        <Text style={styles.hint}>Sign out clears the demo onboarding flag so you can replay the welcome flow.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function Row({ label, value, last }: { label: string; value?: string; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : <Text style={styles.chev}>›</Text>}
    </View>
  );
}

function ToggleRow({ label, defaultOn }: { label: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(!!defaultOn);
  return (
    <View style={[styles.row, styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch value={on} onValueChange={setOn} trackColor={{ true: Theme.primary, false: Theme.border }} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.background },
  scroll: { paddingBottom: Spacing.xl },
  hero: { alignItems: 'center', paddingVertical: Spacing.lg },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Theme.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: { fontSize: 32, fontWeight: '900', color: Theme.primary },
  name: { fontSize: 22, fontWeight: '800', color: Theme.text },
  email: { color: Theme.textSecondary, marginTop: 4 },
  badge: { marginTop: Spacing.sm, backgroundColor: Theme.background, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  badgeText: { fontWeight: '700', color: Theme.textSecondary, fontSize: 12 },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    backgroundColor: Theme.card,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '900', color: Theme.text },
  statLabel: { marginTop: 4, color: Theme.textSecondary, fontWeight: '600', fontSize: 12 },
  section: { paddingHorizontal: Spacing.md, marginBottom: Spacing.lg },
  sectionTitle: { fontWeight: '800', color: Theme.textSecondary, marginBottom: Spacing.sm, fontSize: 13, letterSpacing: 0.4 },
  sectionCard: {
    backgroundColor: Theme.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Theme.border,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Theme.border },
  rowLabel: { fontWeight: '600', color: Theme.text, flex: 1 },
  rowValue: { color: Theme.textSecondary, fontWeight: '600' },
  chev: { fontSize: 22, color: Theme.textMuted, fontWeight: '300' },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  signOutText: { color: Theme.danger, fontWeight: '800', fontSize: 16 },
  hint: { paddingHorizontal: Spacing.lg, color: Theme.textMuted, fontSize: 12, lineHeight: 18 },
});
