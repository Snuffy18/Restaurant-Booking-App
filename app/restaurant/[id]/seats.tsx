import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { FloorPlanMap } from '@/components/floorplan/FloorPlanMap';
import { AiTableRecommendation, FloorPlanState, TableAvailability, TRATTORIA_ROMA_FLOOR_PLAN } from '@/components/floorplan/floorPlanTypes';
import type { AppColors } from '@/constants/Theme';
import { Radius, Spacing } from '@/constants/Theme';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { Booking, getRestaurant } from '@/data/mockData';
import { upsertUserBooking } from '@/lib/bookingsStore';

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    miss: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.background },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      backgroundColor: c.background,
    },
    back: { color: c.primary, fontWeight: '800', fontSize: 16 },
    title: { fontWeight: '900', fontSize: 17, color: c.text, flex: 1, textAlign: 'center' },
    partyRow: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: c.card,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    partyLabel: { color: c.textMuted, fontWeight: '700', fontSize: 12 },
    partyChip: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: Radius.full,
      backgroundColor: c.inputBg,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    partyChipOn: { backgroundColor: c.primaryMuted, borderColor: c.primary },
    partyChipText: { color: c.textSecondary, fontWeight: '700', fontSize: 12 },
    partyChipTextOn: { color: c.primary },
    infoCard: {
      marginHorizontal: Spacing.md,
      marginTop: Spacing.sm,
      marginBottom: Spacing.sm,
      padding: Spacing.md,
      borderRadius: Radius.md,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
    },
    infoTitle: { color: c.text, fontWeight: '800', fontSize: 14 },
    infoSub: { color: c.textSecondary, marginTop: 4, lineHeight: 18 },
    tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    tag: { backgroundColor: c.inputBg, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 4 },
    tagText: { color: c.textMuted, fontSize: 11, fontWeight: '700' },
    sticky: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: c.card,
      borderTopWidth: 1,
      borderTopColor: c.border,
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.md,
    },
    cta: { backgroundColor: c.primary, paddingVertical: 16, borderRadius: Radius.md, alignItems: 'center' },
    ctaText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  });
}

export default function SeatsScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { id, date, time, guests } = useLocalSearchParams<{ id: string; date?: string; time?: string; guests?: string }>();
  const restaurant = useMemo(() => (id ? getRestaurant(String(id)) : undefined), [id]);
  const parsedGuests = Number(guests ?? '2');
  const [partySize, setPartySize] = useState(Number.isFinite(parsedGuests) ? parsedGuests : 2);
  const [selectedId, setSelectedId] = useState<string | null>('t1');
  const insets = useSafeAreaInsets();
  const aiRecommendation: AiTableRecommendation = {
    tableId: 't1',
    reason: 'Quiet window seat with natural light — ideal for your selected party size.',
    confidence: 0.92,
  };

  const availability = useMemo<Record<string, TableAvailability>>(
    () => ({
      t3: { tableId: 't3', status: 'taken', slotTime: `${date ?? 'today'} ${time ?? '19:30'}` },
      t5: { tableId: 't5', status: 'taken', slotTime: `${date ?? 'today'} ${time ?? '19:30'}` },
      t11: { tableId: 't11', status: 'taken', slotTime: `${date ?? 'today'} ${time ?? '19:30'}` },
    }),
    [date, time],
  );

  const floorPlanState: FloorPlanState = {
    selectedTableId: selectedId,
    availability,
    aiRecommendation,
    partySize,
    incompatibleTableIds: [],
  };

  const selectedTable = selectedId ? TRATTORIA_ROMA_FLOOR_PLAN.tables.find((t) => t.id === selectedId) : null;

  if (!restaurant) {
    return (
      <SafeAreaView style={styles.miss}>
        <Text style={{ color: colors.text }}>Not found</Text>
      </SafeAreaView>
    );
  }

  const canReserve = !!selectedTable;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.topBar}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          Choose your table
        </Text>
        <View style={{ width: 48 }} />
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 + insets.bottom }} showsVerticalScrollIndicator={false}>
        <View style={styles.partyRow}>
          <Text style={styles.partyLabel}>Guests</Text>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((size) => (
            <Pressable
              key={size}
              onPress={() => setPartySize(size)}
              style={[styles.partyChip, partySize === size && styles.partyChipOn]}>
              <Text style={[styles.partyChipText, partySize === size && styles.partyChipTextOn]}>{size}</Text>
            </Pressable>
          ))}
        </View>

        <FloorPlanMap
          config={TRATTORIA_ROMA_FLOOR_PLAN}
          state={floorPlanState}
          onTableSelect={setSelectedId}
          onTableDeselect={() => setSelectedId(null)}
          mapHeight={360}
        />

        {selectedTable ? (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>
              {selectedTable.label} · {selectedTable.description}
            </Text>
            <Text style={styles.infoSub}>
              Seats {selectedTable.minCapacity}-{selectedTable.maxCapacity} · {selectedTable.position ?? 'main floor'}
            </Text>
            <View style={styles.tagsWrap}>
              {selectedTable.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.sticky, { paddingBottom: insets.bottom + Spacing.sm }]}>
        <Pressable
          disabled={!canReserve}
          style={[styles.cta, !canReserve && { opacity: 0.4 }]}
          onPress={() => {
            const restaurantId = String(id);
            const generatedRef = `#TRM-${Math.floor(10000 + Math.random() * 90000)}`;
            const bookingDate = date ?? 'Today';
            const bookingTime = time ?? '19:30';
            const bookingGuests = Number(guests ?? '2');
            const restaurant = getRestaurant(restaurantId);
            const createdBooking: Booking = {
              id: `ub-${Date.now()}`,
              ref: generatedRef,
              restaurantId,
              restaurantName: restaurant?.name ?? 'Restaurant',
              image: restaurant?.image ?? '',
              address: restaurant?.address ?? '',
              date: bookingDate,
              time: bookingTime,
              guests: bookingGuests,
              tableName: selectedTable?.label ?? '',
              status: 'upcoming',
              reminderText: 'Reminder set · 2 hours before · Free cancel until 48h prior to your booking',
            };

            void upsertUserBooking(createdBooking).finally(() => {
              router.push({
                pathname: '/booking/confirm',
                params: {
                  restaurantId,
                  tableName: createdBooking.tableName,
                  ref: generatedRef,
                  date: bookingDate,
                  time: bookingTime,
                  guests: String(bookingGuests),
                },
              });
            });
          }}>
          <Text style={styles.ctaText}>Reserve selected table</Text>
        </Pressable>
      </View>
    </View>
  );
}
