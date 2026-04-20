import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import FontAwesome from '@expo/vector-icons/FontAwesome';

import type { AppColors } from '@/constants/Theme';
import { Radius, Spacing } from '@/constants/Theme';
import type { ThemePreference } from '@/contexts/AppThemeContext';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { MOCK_USER } from '@/data/mockData';
import { setOnboardingComplete } from '@/lib/onboardingStorage';

function createStyles(c: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    scroll: { paddingBottom: Spacing.xl },
    hero: { alignItems: 'center', paddingVertical: Spacing.lg },
    avatar: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: c.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.md,
    },
    avatarText: { fontSize: 32, fontWeight: '900', color: c.primary },
    name: { fontSize: 22, fontWeight: '800', color: c.text },
    email: { color: c.textSecondary, marginTop: 4 },
    badge: { marginTop: Spacing.sm, backgroundColor: c.inputBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
    badgeText: { fontWeight: '700', color: c.textSecondary, fontSize: 12 },
    stats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginHorizontal: Spacing.md,
      marginBottom: Spacing.lg,
      backgroundColor: c.card,
      borderRadius: Radius.lg,
      paddingVertical: Spacing.md,
      borderWidth: 1,
      borderColor: c.border,
    },
    stat: { alignItems: 'center' },
    statValue: { fontSize: 20, fontWeight: '900', color: c.text },
    statLabel: { marginTop: 4, color: c.textSecondary, fontWeight: '600', fontSize: 12 },
    section: { paddingHorizontal: Spacing.md, marginBottom: Spacing.lg },
    sectionTitle: { fontWeight: '800', color: c.textSecondary, marginBottom: Spacing.sm, fontSize: 13, letterSpacing: 0.4 },
    sectionCard: {
      backgroundColor: c.card,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
    },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: c.border },
    rowLabel: { fontWeight: '600', color: c.text, flex: 1 },
    rowValue: { color: c.textSecondary, fontWeight: '600' },
    chev: { fontSize: 22, color: c.textMuted, fontWeight: '300' },
    signOut: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      padding: Spacing.md,
    },
    signOutText: { color: c.danger, fontWeight: '800', fontSize: 16 },
    hint: { paddingHorizontal: Spacing.lg, color: c.textMuted, fontSize: 12, lineHeight: 18 },
    appearanceRow: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md },
    appearancePill: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.inputBg,
    },
    appearancePillOn: { borderColor: c.primary, backgroundColor: c.primaryMuted },
    appearanceLabel: { fontWeight: '700', fontSize: 13, color: c.textSecondary },
    appearanceLabelOn: { color: c.primary },
  });
}

type ProfileStyles = ReturnType<typeof createStyles>;

function Stat({ label, value, styles }: { label: string; value: string; styles: ProfileStyles }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Section({ title, children, styles }: { title: string; children: React.ReactNode; styles: ProfileStyles }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function Row({ label, value, last, styles }: { label: string; value?: string; last?: boolean; styles: ProfileStyles }) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : <Text style={styles.chev}>›</Text>}
    </View>
  );
}

function ToggleRow({
  label,
  defaultOn,
  styles,
  colors,
}: {
  label: string;
  defaultOn?: boolean;
  styles: ProfileStyles;
  colors: AppColors;
}) {
  const [on, setOn] = useState(!!defaultOn);
  return (
    <View style={[styles.row, styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch value={on} onValueChange={setOn} trackColor={{ true: colors.primary, false: colors.border }} thumbColor="#f4f3f4" />
    </View>
  );
}

const APPEARANCE_OPTIONS: { key: ThemePreference; label: string }[] = [
  { key: 'system', label: 'System' },
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
];

export default function ProfileScreen() {
  const { colors, preference, setPreference } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
          <Stat label="Bookings" value="12" styles={styles} />
          <Stat label="Visited" value="8" styles={styles} />
          <Stat label="Reviews" value="3" styles={styles} />
        </View>

        <Section title="Appearance" styles={styles}>
          <View style={styles.appearanceRow}>
            {APPEARANCE_OPTIONS.map(({ key, label }) => (
              <Pressable
                key={key}
                onPress={() => setPreference(key)}
                style={[styles.appearancePill, preference === key && styles.appearancePillOn]}>
                <Text style={[styles.appearanceLabel, preference === key && styles.appearanceLabelOn]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </Section>

        <Section title="Preferences" styles={styles}>
          <Row label="Cuisine preferences" value="Italian, Japanese" styles={styles} />
          <Row label="Dining vibe" value="Romantic, Casual" styles={styles} />
          <Row label="Dietary requirements" value="None set" last styles={styles} />
        </Section>

        <Section title="Favourites" styles={styles}>
          <Row label="Saved restaurants" value="4 places" styles={styles} />
          <Row label="My reviews" value="3" last styles={styles} />
        </Section>

        <Section title="Notifications" styles={styles}>
          <ToggleRow label="Booking reminders" defaultOn styles={styles} colors={colors} />
          <ToggleRow label="Email confirmations" defaultOn styles={styles} colors={colors} />
          <ToggleRow label="Special offers" styles={styles} colors={colors} />
        </Section>

        <Section title="Account" styles={styles}>
          <Row label="Change password" styles={styles} />
          <Row label="Privacy settings" last styles={styles} />
          <Pressable
            style={styles.signOut}
            onPress={async () => {
              await setOnboardingComplete(false);
              router.replace('/');
            }}>
            <FontAwesome name="sign-out" size={18} color={colors.danger} />
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        </Section>

        <Text style={styles.hint}>Sign out clears the demo onboarding flag so you can replay the welcome flow.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
