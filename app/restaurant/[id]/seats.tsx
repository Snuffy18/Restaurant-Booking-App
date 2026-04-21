import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { FloorPlanMap } from '@/components/floorplan/FloorPlanMap';
import {
  AiTableRecommendation,
  FloorPlanState,
  TableAvailability,
  TRATTORIA_ROMA_FLOOR_PLAN,
  getCompatibleTables,
} from '@/components/floorplan/floorPlanTypes';
import type { AppColors } from '@/constants/Theme';
import { Radius, Spacing } from '@/constants/Theme';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { getRestaurant } from '@/data/mockData';
import { useFloorPlan } from '@/lib/useFloorPlan';

const STATUS_COLOURS = {
  available: '#EF9F27',
  taken: '#D3D1C7',
  selected: '#BC5A13',
  ai_pick: '#F9CB42',
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    miss: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.background },

    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      backgroundColor: c.background,
    },
    backBtn: { paddingVertical: 4, paddingRight: 8 },
    backText: { color: c.primary, fontWeight: '800', fontSize: 16 },
    topTitle: { fontWeight: '900', fontSize: 17, color: c.text, flex: 1, textAlign: 'center' },
    topSpacer: { width: 44 },

    contextStrip: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingHorizontal: Spacing.md,
      paddingVertical: 8,
      backgroundColor: c.card,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    contextDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: c.border },
    contextText: { color: c.textSecondary, fontSize: 12, fontWeight: '700' },

    mapContainer: { flex: 1 },

    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F5F3EE',
    },
    loadingText: { marginTop: 10, color: c.textMuted, fontSize: 13, fontWeight: '600' },

    legend: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 14,
      paddingVertical: 8,
      paddingHorizontal: Spacing.md,
      backgroundColor: c.background,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { color: c.textMuted, fontSize: 11, fontWeight: '600' },

    bottomPanel: {
      backgroundColor: c.card,
      borderTopWidth: 1,
      borderTopColor: c.border,
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.sm,
    },
    noSelectionHint: {
      alignItems: 'center',
      paddingVertical: Spacing.sm,
    },
    noSelectionText: { color: c.textMuted, fontSize: 13, fontWeight: '600' },

    tableInfoRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    tableNameGroup: { flex: 1, marginRight: Spacing.sm },
    tableName: { color: c.text, fontWeight: '900', fontSize: 15 },
    tableDesc: { color: c.textSecondary, fontSize: 12, marginTop: 2 },
    tableMeta: { color: c.textMuted, fontSize: 12, fontWeight: '700' },

    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: Spacing.sm },
    tag: { backgroundColor: c.inputBg, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
    tagText: { color: c.textMuted, fontSize: 11, fontWeight: '700' },

    cta: {
      backgroundColor: c.primary,
      paddingVertical: 14,
      borderRadius: Radius.md,
      alignItems: 'center',
      marginBottom: 4,
    },
    ctaDisabled: { opacity: 0.38 },
    ctaText: { color: '#fff', fontWeight: '900', fontSize: 15 },
    ctaSub: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 2 },
  });
}

export default function SeatsScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const { id, date, time, guests } = useLocalSearchParams<{
    id: string;
    date?: string;
    time?: string;
    guests?: string;
  }>();

  const restaurant = useMemo(() => (id ? getRestaurant(String(id)) : undefined), [id]);
  const parsedGuests = Number(guests ?? '2');
  const [partySize, setPartySize] = useState(Number.isFinite(parsedGuests) ? parsedGuests : 2);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { config: supabaseFloor, loading: floorLoading } = useFloorPlan(id ? String(id) : undefined);
  const floorPlan = supabaseFloor ?? TRATTORIA_ROMA_FLOOR_PLAN;

  const aiRecommendation = useMemo<AiTableRecommendation | null>(() => {
    const firstCompatible = floorPlan.tables.find(
      (t) => t.maxCapacity >= partySize,
    );
    if (!firstCompatible) return null;
    return {
      tableId: firstCompatible.id,
      reason: 'Best match for your party size and preferences.',
      confidence: 0.88,
    };
  }, [floorPlan.tables, partySize]);

  // Auto-select AI pick when floor loads
  useEffect(() => {
    if (!floorLoading && aiRecommendation && !selectedId) {
      setSelectedId(aiRecommendation.tableId);
    }
  }, [floorLoading, aiRecommendation]);


  const availability = useMemo<Record<string, TableAvailability>>(() => {
    const slot = `${date ?? 'today'} ${time ?? '19:30'}`;
    const takenIds = floorPlan.tables
      .filter((_, i) => i % 4 === 2)
      .map((t) => t.id);
    return Object.fromEntries(
      takenIds.map((tableId) => [tableId, { tableId, status: 'taken' as const, slotTime: slot }]),
    );
  }, [floorPlan.tables, date, time]);

  const incompatibleTableIds = useMemo(
    () => {
      const compatible = new Set(getCompatibleTables(floorPlan.tables, partySize));
      return floorPlan.tables.filter((t) => !compatible.has(t.id)).map((t) => t.id);
    },
    [floorPlan.tables, partySize],
  );

  const floorPlanState: FloorPlanState = {
    selectedTableId: selectedId,
    availability,
    aiRecommendation,
    partySize,
    incompatibleTableIds,
  };

  const selectedTable = selectedId ? floorPlan.tables.find((t) => t.id === selectedId) : null;

  const panelAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(panelAnim, {
      toValue: selectedTable ? 1 : 0,
      useNativeDriver: true,
      tension: 90,
      friction: 14,
    }).start();
  }, [!!selectedTable]);

  if (!restaurant) {
    return (
      <SafeAreaView style={styles.miss}>
        <Text style={{ color: colors.text }}>Restaurant not found</Text>
      </SafeAreaView>
    );
  }

  const resolvedDate = date ?? 'Today';
  const resolvedTime = time ?? '19:30';

  // Compute dynamic map height: whatever is left after all fixed chrome
  // (topBar ~50 + contextStrip ~37 + partyRow ~47 + legend ~37 + bottomPanel ~118 + insets)
  const fixedChrome = 50 + 37 + 37 + 118 + insets.top + insets.bottom;
  const mapHeight = Math.max(220, screenHeight - fixedChrome);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.topBar}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>Choose your table</Text>
        <View style={styles.topSpacer} />
      </SafeAreaView>

      <View style={styles.contextStrip}>
        <Text style={styles.contextText}>{restaurant.name}</Text>
        <View style={styles.contextDot} />
        <Text style={styles.contextText}>{resolvedDate}</Text>
        <View style={styles.contextDot} />
        <Text style={styles.contextText}>{resolvedTime}</Text>
        <View style={styles.contextDot} />
        <Text style={styles.contextText}>{partySize} {partySize === 1 ? 'guest' : 'guests'}</Text>
      </View>

      <View style={styles.mapContainer}>
        {floorLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.loadingText}>Loading floor plan…</Text>
          </View>
        ) : (
          <FloorPlanMap
            config={floorPlan}
            state={floorPlanState}
            onTableSelect={setSelectedId}
            onTableDeselect={() => setSelectedId(null)}
            mapHeight={mapHeight}
          />
        )}
      </View>

      <View style={styles.legend}>
        {[
          { color: STATUS_COLOURS.available, label: 'Available' },
          { color: STATUS_COLOURS.taken, label: 'Taken' },
          { color: STATUS_COLOURS.selected, label: 'Selected' },
          { color: STATUS_COLOURS.ai_pick, label: 'AI pick' },
        ].map(({ color, label }) => (
          <View key={label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendText}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.bottomPanel, { paddingBottom: insets.bottom + 8 }]}>
        {selectedTable ? (
          <Animated.View
            style={{
              opacity: panelAnim,
              transform: [{ translateY: panelAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
            }}>
            <View style={styles.tableInfoRow}>
              <View style={styles.tableNameGroup}>
                <Text style={styles.tableName}>
                  {selectedTable.label}
                  {selectedTable.description ? ` · ${selectedTable.description}` : ''}
                </Text>
                <Text style={styles.tableDesc}>
                  {selectedTable.position ?? selectedTable.zoneId ?? 'Main floor'}
                </Text>
              </View>
              <Text style={styles.tableMeta}>
                {selectedTable.minCapacity === selectedTable.maxCapacity
                  ? `${selectedTable.maxCapacity} seats`
                  : `${selectedTable.minCapacity}–${selectedTable.maxCapacity} seats`}
              </Text>
            </View>

            {selectedTable.tags.length > 0 && (
              <View style={styles.tagsRow}>
                {selectedTable.tags.map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            <Pressable
              style={styles.cta}
              onPress={() => {
                router.push({
                  pathname: '/booking/review',
                  params: {
                    restaurantId: String(id),
                    tableName: selectedTable.label,
                    date: resolvedDate,
                    time: resolvedTime,
                    guests: String(partySize),
                  },
                });
              }}>
              <Text style={styles.ctaText}>Reserve {selectedTable.label}</Text>
              <Text style={styles.ctaSub}>{resolvedDate} · {resolvedTime} · {partySize} {partySize === 1 ? 'guest' : 'guests'}</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <View style={styles.noSelectionHint}>
            <Text style={styles.noSelectionText}>
              {floorLoading ? 'Loading…' : 'Tap a table to select it'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
