import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FloorPlanMap } from './FloorPlanMap';
import { AiTableRecommendation, FloorPlanState, TableAvailability, TRATTORIA_ROMA_FLOOR_PLAN } from './floorPlanTypes';

const MOCK_AVAILABILITY: Record<string, TableAvailability> = {
  t3: { tableId: 't3', status: 'taken', slotTime: '2025-05-24T20:00:00Z' },
  t5: { tableId: 't5', status: 'taken', slotTime: '2025-05-24T20:00:00Z' },
  t11: { tableId: 't11', status: 'taken', slotTime: '2025-05-24T20:00:00Z' },
};

const MOCK_AI_RECOMMENDATION: AiTableRecommendation = {
  tableId: 't1',
  reason: 'Quiet window seat with natural light — ideal for a romantic dinner for 2.',
  confidence: 0.92,
};

const PARTY_SIZES = [1, 2, 3, 4, 5, 6, 7, 8];

export const SeatSelectionScreen: React.FC = () => {
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [partySize, setPartySize] = useState(2);

  const floorPlanState: FloorPlanState = {
    selectedTableId,
    availability: MOCK_AVAILABILITY,
    aiRecommendation: MOCK_AI_RECOMMENDATION,
    partySize,
    incompatibleTableIds: [],
  };

  const handleTableSelect = useCallback((tableId: string) => {
    setSelectedTableId(tableId);
  }, []);

  const handleTableDeselect = useCallback(() => {
    setSelectedTableId(null);
  }, []);

  const selectedTable = selectedTableId ? TRATTORIA_ROMA_FLOOR_PLAN.tables.find((t) => t.id === selectedTableId) : null;

  const isAiPick = selectedTableId === MOCK_AI_RECOMMENDATION.tableId;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.restaurantName}>Trattoria Roma</Text>
          <Text style={styles.slotInfo}>Sat 24 May · 8:00 PM</Text>
        </View>
        <View style={styles.aiChip}>
          <Text style={styles.aiChipText}>★ AI pick: T1</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.partySizeScroll}
        contentContainerStyle={styles.partySizeContent}>
        <Text style={styles.partySizeLabel}>Guests</Text>
        {PARTY_SIZES.map((size) => (
          <Pressable
            key={size}
            onPress={() => {
              setPartySize(size);
              if (selectedTable && selectedTable.maxCapacity < size) {
                setSelectedTableId(null);
              }
            }}
            style={[styles.partySizeChip, partySize === size && styles.partySizeChipActive]}>
            <Text style={[styles.partySizeChipText, partySize === size && styles.partySizeChipTextActive]}>{size}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.legend}>
        {[
          { label: 'Available', bg: '#E1F5EE', border: '#1D9E75' },
          { label: 'Taken', bg: '#F1EFE8', border: '#D3D1C7' },
          { label: 'Selected', bg: '#1D9E75', border: '#0F6E56' },
          { label: 'AI pick', bg: '#FAEEDA', border: '#EF9F27' },
        ].map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.bg, borderColor: item.border }]} />
            <Text style={styles.legendText}>{item.label}</Text>
          </View>
        ))}
      </View>

      <FloorPlanMap
        config={TRATTORIA_ROMA_FLOOR_PLAN}
        state={floorPlanState}
        onTableSelect={handleTableSelect}
        onTableDeselect={handleTableDeselect}
        mapHeight={340}
      />

      <View style={styles.bottomSheet}>
        {!selectedTable ? (
          <Text style={styles.bottomSheetHint}>Tap a table to see details</Text>
        ) : (
          <View>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>
                  {selectedTable.label} · {selectedTable.description}
                </Text>
                <Text style={styles.sheetSub}>
                  Seats {selectedTable.minCapacity}–{selectedTable.maxCapacity} guests
                </Text>
              </View>
              {isAiPick && (
                <View style={styles.aiPickBadge}>
                  <Text style={styles.aiPickText}>★ AI pick</Text>
                </View>
              )}
            </View>

            <View style={styles.tagsRow}>
              {selectedTable.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>

            {isAiPick && (
              <View style={styles.aiReason}>
                <Text style={styles.aiReasonText}>{MOCK_AI_RECOMMENDATION.reason}</Text>
              </View>
            )}

            <Pressable style={styles.reserveButton}>
              <Text style={styles.reserveButtonText}>Reserve this table →</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F3F0',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  restaurantName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  slotInfo: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  aiChip: {
    backgroundColor: '#FAEEDA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  aiChipText: {
    fontSize: 11,
    color: '#854F0B',
    fontWeight: '500',
  },
  partySizeScroll: {
    backgroundColor: 'white',
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
    maxHeight: 44,
  },
  partySizeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 8,
  },
  partySizeLabel: {
    fontSize: 11,
    color: '#888',
    marginRight: 4,
  },
  partySizeChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#ddd',
    backgroundColor: 'white',
  },
  partySizeChipActive: {
    backgroundColor: '#1D9E75',
    borderColor: '#1D9E75',
  },
  partySizeChipText: {
    fontSize: 12,
    color: '#555',
  },
  partySizeChipTextActive: {
    color: '#04342C',
    fontWeight: '500',
  },
  legend: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: 'white',
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
    borderWidth: 1.5,
  },
  legendText: {
    fontSize: 10,
    color: '#888',
  },
  bottomSheet: {
    backgroundColor: 'white',
    borderTopWidth: 0.5,
    borderTopColor: '#eee',
    padding: 14,
    minHeight: 80,
  },
  bottomSheetHint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#aaa',
    paddingVertical: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  sheetSub: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  aiPickBadge: {
    backgroundColor: '#FAEEDA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  aiPickText: {
    fontSize: 10,
    color: '#633806',
    fontWeight: '500',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#F5F3F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 10,
    color: '#666',
  },
  aiReason: {
    backgroundColor: '#FAEEDA',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  aiReasonText: {
    fontSize: 11,
    color: '#854F0B',
    lineHeight: 16,
  },
  reserveButton: {
    backgroundColor: '#1D9E75',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  reserveButtonText: {
    color: '#04342C',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default SeatSelectionScreen;
