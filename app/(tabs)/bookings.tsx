import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AppColors } from '@/constants/Theme';
import { Radius, Spacing } from '@/constants/Theme';
import { TabScreenFade } from '@/components/TabScreenFade';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { Booking } from '@/data/mockData';
import { getAllBookings } from '@/lib/bookingsStore';

type Tab = 'upcoming' | 'past';

function createStyles(c: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    title: { fontSize: 28, fontWeight: '800', paddingHorizontal: Spacing.md, marginBottom: Spacing.md, color: c.text },
    tabs: {
      flexDirection: 'row',
      marginHorizontal: Spacing.md,
      backgroundColor: c.card,
      borderRadius: Radius.lg,
      padding: 4,
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: c.border,
    },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.md },
    tabOn: { backgroundColor: c.primaryMuted },
    tabText: { fontWeight: '700', color: c.textSecondary },
    tabTextOn: { color: c.primary },
    list: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl, gap: Spacing.md },
    card: {
      backgroundColor: c.card,
      borderRadius: Radius.lg,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: c.border,
    },
    cardTop: { flexDirection: 'row', gap: Spacing.md },
    thumb: { width: 72, height: 72, borderRadius: Radius.md },
    rowBetween: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    cardTitle: { flex: 1, fontWeight: '800', fontSize: 17, color: c.text },
    qrIcon: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: c.inputBg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    qrGlyph: { fontSize: 18, color: c.text },
    confirmed: {
      alignSelf: 'flex-start',
      marginTop: 6,
      backgroundColor: c.primaryMuted,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: Radius.full,
    },
    confirmedText: { color: c.primary, fontWeight: '800', fontSize: 11 },
    refText: { marginTop: 6, color: c.textMuted, fontSize: 12, fontWeight: '600' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: Spacing.md, gap: Spacing.md },
    col: { width: '45%' },
    colLabel: { color: c.textMuted, fontSize: 12, marginBottom: 4 },
    colValue: { fontWeight: '700', color: c.text },
    reminder: {
      marginTop: Spacing.md,
      backgroundColor: c.aiMuted,
      padding: Spacing.md,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: c.aiBorder,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    reminderText: { flex: 1, flexShrink: 1, color: c.ai, fontWeight: '600', fontSize: 13, lineHeight: 18 },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md },
    actionBtn: {
      backgroundColor: c.primary,
      paddingHorizontal: Spacing.md,
      paddingVertical: 10,
      borderRadius: Radius.md,
    },
    actionBtnText: { color: '#fff', fontWeight: '800' },
    actionGhost: {
      paddingHorizontal: Spacing.md,
      paddingVertical: 10,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.inputBg,
    },
    actionGhostText: { fontWeight: '700', color: c.text },
    statusBadge: { alignSelf: 'flex-start', marginTop: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
    statusOk: { backgroundColor: c.primaryMuted },
    statusBad: { backgroundColor: c.dangerMuted },
    statusBadgeText: { fontWeight: '800', fontSize: 11 },
    statusTextOk: { color: c.primary },
    statusTextBad: { color: c.danger },
    fillerCard: {
      borderStyle: 'dashed',
      padding: Spacing.md,
      marginTop: Spacing.sm,
      alignItems: 'center',
      gap: Spacing.sm,
    },
    fillerIconWrap: {
      width: 40,
      height: 40,
      borderRadius: Radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fillerTitle: { fontSize: 15, fontWeight: '700', color: c.textSecondary, textAlign: 'center' },
    fillerCta: {
      backgroundColor: c.primaryMuted,
      borderRadius: Radius.full,
      paddingHorizontal: Spacing.md,
      paddingVertical: 8,
      marginTop: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    fillerCtaText: { color: c.primary, fontWeight: '800' },
  });
}

type BookingsStyles = ReturnType<typeof createStyles>;

function Col({ label, value, styles }: { label: string; value: string; styles: BookingsStyles }) {
  return (
    <View style={styles.col}>
      <Text style={styles.colLabel}>{label}</Text>
      <Text style={styles.colValue}>{value}</Text>
    </View>
  );
}

function UpcomingCard({ booking: b, styles }: { booking: Booking; styles: BookingsStyles }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Image source={{ uri: b.image }} style={styles.thumb} contentFit="cover" />
        <View style={{ flex: 1 }}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {b.restaurantName}
            </Text>
            <Pressable onPress={() => router.push({ pathname: '/booking/confirm', params: { ref: b.ref } })} style={styles.qrIcon}>
              <Text style={styles.qrGlyph}>▣</Text>
            </Pressable>
          </View>
          <View style={styles.confirmed}>
            <Text style={styles.confirmedText}>Confirmed</Text>
          </View>
          <Text style={styles.refText}>{b.ref}</Text>
        </View>
      </View>
      <View style={styles.grid}>
        <Col label="Date" value={b.date} styles={styles} />
        <Col label="Time" value={b.time} styles={styles} />
        <Col label="Table" value={b.tableName} styles={styles} />
        <Col label="Guests" value={String(b.guests)} styles={styles} />
      </View>
      {b.reminderText ? (
        <View style={styles.reminder}>
          <Ionicons name="notifications-outline" size={20} color={colors.ai} />
          <Text style={styles.reminderText}>{b.reminderText}</Text>
        </View>
      ) : null}
      <View style={styles.actions}>
        <Pressable style={styles.actionBtn} onPress={() => router.push({ pathname: '/booking/confirm', params: { ref: b.ref } })}>
          <Text style={styles.actionBtnText}>Show QR</Text>
        </Pressable>
        <Pressable style={styles.actionGhost}>
          <Text style={styles.actionGhostText}>Directions</Text>
        </Pressable>
        <Pressable style={styles.actionGhost}>
          <Text style={[styles.actionGhostText, { color: colors.danger }]}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

function PastCard({ booking: b, styles }: { booking: Booking; styles: BookingsStyles }) {
  const completed = b.status === 'completed';
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Image source={{ uri: b.image }} style={styles.thumb} contentFit="cover" />
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{b.restaurantName}</Text>
          <View style={[styles.statusBadge, completed ? styles.statusOk : styles.statusBad]}>
            <Text style={[styles.statusBadgeText, completed ? styles.statusTextOk : styles.statusTextBad]}>
              {completed ? 'Completed' : 'Cancelled'}
            </Text>
          </View>
          <Text style={styles.refText}>{b.ref}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        {completed ? (
          <Pressable style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>Leave review</Text>
          </Pressable>
        ) : null}
        <Pressable style={styles.actionGhost}>
          <Text style={styles.actionGhostText}>Book again</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function BookingsScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [tab, setTab] = useState<Tab>('upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void getAllBookings().then((next) => {
        if (active) setBookings(next);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const upcoming = bookings.filter((b) => b.status === 'upcoming');
  const past = bookings.filter((b) => b.status !== 'upcoming');
  const activeBookings = tab === 'upcoming' ? upcoming : past;
  const shouldShowFiller = activeBookings.length === 1;

  return (
    <TabScreenFade>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Text style={styles.title}>My bookings</Text>
        <View style={styles.tabs}>
          <Pressable onPress={() => setTab('upcoming')} style={[styles.tab, tab === 'upcoming' && styles.tabOn]}>
            <Text style={[styles.tabText, tab === 'upcoming' && styles.tabTextOn]}>Upcoming</Text>
          </Pressable>
          <Pressable onPress={() => setTab('past')} style={[styles.tab, tab === 'past' && styles.tabOn]}>
            <Text style={[styles.tabText, tab === 'past' && styles.tabTextOn]}>Past</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {tab === 'upcoming'
            ? upcoming.map((b) => <UpcomingCard key={b.id} booking={b} styles={styles} />)
            : past.map((b) => <PastCard key={b.id} booking={b} styles={styles} />)}
          {shouldShowFiller ? (
            <View style={styles.fillerCard}>
              <View style={styles.fillerIconWrap}>
                <Ionicons name="calendar-outline" size={40} color={colors.primary} />
              </View>
              <Text style={styles.fillerTitle}>
                {tab === 'upcoming'
                  ? 'No more upcoming bookings \n find your next table.'
                  : 'No more past bookings - discover your next favorite spot.'}
              </Text>
              <Pressable style={styles.fillerCta} onPress={() => router.push('/(tabs)/explore')}>
                <Text style={styles.fillerCtaText}>Explore restaurants</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </TabScreenFade>
  );
}
