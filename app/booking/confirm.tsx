import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';

import { Theme, Radius, Spacing } from '@/constants/Theme';
import { getRestaurant, MOCK_BOOKINGS } from '@/data/mockData';

export default function BookingConfirmScreen() {
  const params = useLocalSearchParams<{
    ref?: string;
    restaurantId?: string;
    tableName?: string;
  }>();

  const booking = useMemo(() => {
    if (params.ref) {
      return MOCK_BOOKINGS.find((b) => b.ref === params.ref);
    }
    return undefined;
  }, [params.ref]);

  const restaurant = params.restaurantId ? getRestaurant(String(params.restaurantId)) : booking ? getRestaurant(booking.restaurantId) : undefined;

  const ref = params.ref ?? booking?.ref ?? '#TRM-00000';
  const tableName = params.tableName ?? booking?.tableName ?? 'Table';
  const restaurantName = restaurant?.name ?? booking?.restaurantName ?? 'Restaurant';
  const address = restaurant?.address ?? booking?.address ?? '';
  const date = booking?.date ?? 'Fri 23 May';
  const time = booking?.time ?? '19:30';
  const guests = booking?.guests ?? 2;
  const special = booking?.specialRequests;

  const qrPayload = JSON.stringify({ ref, restaurant: restaurantName, table: tableName });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.check}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
          <Text style={styles.headerTitle}>You’re booked</Text>
          <Text style={styles.headerSub}>Show this QR at the host stand — we’ll seat you right away.</Text>
        </View>

        <View style={styles.ticket}>
          <View style={styles.ticketInner}>
            <Text style={styles.restName}>{restaurantName}</Text>
            <Text style={styles.address}>{address}</Text>
            <View style={styles.dashed} />
            <View style={styles.row}>
              <Text style={styles.label}>Date</Text>
              <Text style={styles.value}>{date}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Time</Text>
              <Text style={styles.value}>{time}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Guests</Text>
              <Text style={styles.value}>{guests}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Table</Text>
              <Text style={styles.value}>{tableName}</Text>
            </View>
            {special ? (
              <View style={styles.requests}>
                <Text style={styles.requestsLabel}>Special requests</Text>
                <Text style={styles.requestsBody}>{special}</Text>
              </View>
            ) : null}
            <View style={styles.perfRow}>
              {Array.from({ length: 12 }).map((_, i) => (
                <View key={i} style={styles.perfDot} />
              ))}
            </View>
            <View style={styles.qrWrap}>
              <QRCode value={qrPayload} size={180} color={Theme.text} backgroundColor={Theme.card} />
            </View>
            <Text style={styles.ref}>{ref}</Text>
          </View>
        </View>

        <View style={styles.purpleStrip}>
          <Text style={styles.purpleText}>Reminder · 2 hours before · Free cancel until 48h prior to your booking</Text>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>Show QR</Text>
          </Pressable>
          <Pressable style={styles.actionGhost}>
            <Text style={styles.actionGhostText}>Add to calendar</Text>
          </Pressable>
          <Pressable style={styles.actionGhost}>
            <Text style={styles.actionGhostText}>Share</Text>
          </Pressable>
        </View>

        <Pressable onPress={() => router.replace('/(tabs)/bookings')} style={styles.done}>
          <Text style={styles.doneText}>View my bookings</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.background },
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xl },
  header: {
    backgroundColor: Theme.primary,
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
  ticket: {
    backgroundColor: Theme.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Theme.border,
    overflow: 'hidden',
  },
  ticketInner: { padding: Spacing.lg },
  restName: { fontSize: 22, fontWeight: '900', color: Theme.text, textAlign: 'center' },
  address: { marginTop: 6, color: Theme.textSecondary, textAlign: 'center' },
  dashed: {
    marginVertical: Spacing.lg,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: Theme.border,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  label: { color: Theme.textMuted, fontWeight: '600' },
  value: { color: Theme.text, fontWeight: '800' },
  requests: {
    marginTop: Spacing.md,
    backgroundColor: Theme.background,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  requestsLabel: { fontSize: 12, fontWeight: '800', color: Theme.textMuted, marginBottom: 6 },
  requestsBody: { color: Theme.textSecondary, lineHeight: 20 },
  perfRow: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  perfDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Theme.border },
  qrWrap: { alignItems: 'center', marginBottom: Spacing.md },
  ref: { textAlign: 'center', fontWeight: '900', color: Theme.text, letterSpacing: 1 },
  purpleStrip: {
    marginTop: Spacing.lg,
    backgroundColor: Theme.aiMuted,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#D4CFF5',
  },
  purpleText: { color: Theme.ai, fontWeight: '600', lineHeight: 20 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.lg },
  actionBtn: {
    flexGrow: 1,
    minWidth: '30%',
    backgroundColor: Theme.primary,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  actionBtnText: { color: '#fff', fontWeight: '900' },
  actionGhost: {
    flexGrow: 1,
    minWidth: '30%',
    borderWidth: 1,
    borderColor: Theme.border,
    backgroundColor: Theme.card,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  actionGhostText: { fontWeight: '800', color: Theme.text },
  done: { marginTop: Spacing.lg, alignItems: 'center', padding: Spacing.md },
  doneText: { color: Theme.ai, fontWeight: '900' },
});
