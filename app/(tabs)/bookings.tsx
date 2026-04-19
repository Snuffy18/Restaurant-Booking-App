import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Theme, Radius, Spacing } from '@/constants/Theme';
import { MOCK_BOOKINGS, Booking } from '@/data/mockData';

type Tab = 'upcoming' | 'past';

export default function BookingsScreen() {
  const [tab, setTab] = useState<Tab>('upcoming');
  const upcoming = MOCK_BOOKINGS.filter((b) => b.status === 'upcoming');
  const past = MOCK_BOOKINGS.filter((b) => b.status !== 'upcoming');

  return (
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
          ? upcoming.map((b) => <UpcomingCard key={b.id} booking={b} />)
          : past.map((b) => <PastCard key={b.id} booking={b} />)}
      </ScrollView>
    </SafeAreaView>
  );
}

function UpcomingCard({ booking: b }: { booking: Booking }) {
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
        <Col label="Date" value={b.date} />
        <Col label="Time" value={b.time} />
        <Col label="Table" value={b.tableName} />
        <Col label="Guests" value={String(b.guests)} />
      </View>
      {b.reminderText ? (
        <View style={styles.reminder}>
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
          <Text style={[styles.actionGhostText, { color: Theme.danger }]}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

function PastCard({ booking: b }: { booking: Booking }) {
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

function Col({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.col}>
      <Text style={styles.colLabel}>{label}</Text>
      <Text style={styles.colValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.background },
  title: { fontSize: 28, fontWeight: '800', paddingHorizontal: Spacing.md, marginBottom: Spacing.md, color: Theme.text },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    backgroundColor: Theme.card,
    borderRadius: Radius.md,
    padding: 4,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.sm },
  tabOn: { backgroundColor: Theme.primaryMuted },
  tabText: { fontWeight: '700', color: Theme.textSecondary },
  tabTextOn: { color: Theme.primary },
  list: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl, gap: Spacing.md },
  card: {
    backgroundColor: Theme.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  cardTop: { flexDirection: 'row', gap: Spacing.md },
  thumb: { width: 72, height: 72, borderRadius: Radius.md },
  rowBetween: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cardTitle: { flex: 1, fontWeight: '800', fontSize: 17, color: Theme.text },
  qrIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Theme.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.border,
  },
  qrGlyph: { fontSize: 18, color: Theme.text },
  confirmed: {
    alignSelf: 'flex-start',
    marginTop: 6,
    backgroundColor: Theme.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  confirmedText: { color: Theme.primary, fontWeight: '800', fontSize: 11 },
  refText: { marginTop: 6, color: Theme.textMuted, fontSize: 12, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: Spacing.md, gap: Spacing.md },
  col: { width: '45%' },
  colLabel: { color: Theme.textMuted, fontSize: 12, marginBottom: 4 },
  colValue: { fontWeight: '700', color: Theme.text },
  reminder: {
    marginTop: Spacing.md,
    backgroundColor: Theme.aiMuted,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#D4CFF5',
  },
  reminderText: { color: Theme.ai, fontWeight: '600', fontSize: 13 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md },
  actionBtn: {
    backgroundColor: Theme.primary,
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
    borderColor: Theme.border,
    backgroundColor: Theme.background,
  },
  actionGhostText: { fontWeight: '700', color: Theme.text },
  statusBadge: { alignSelf: 'flex-start', marginTop: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
  statusOk: { backgroundColor: Theme.primaryMuted },
  statusBad: { backgroundColor: '#FEE2E2' },
  statusBadgeText: { fontWeight: '800', fontSize: 11 },
  statusTextOk: { color: Theme.primary },
  statusTextBad: { color: Theme.danger },
});
