import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { SeatPreviewIcon } from '@/components/SeatPreviewIcon';
import type { AppColors } from '@/constants/Theme';
import { Radius, Spacing } from '@/constants/Theme';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { getRestaurant, tablesForRestaurant } from '@/data/mockData';

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
    aiChip: {
      alignSelf: 'flex-start',
      marginHorizontal: Spacing.md,
      marginTop: Spacing.md,
      backgroundColor: c.aiMuted,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: Radius.full,
      borderWidth: 1,
      borderColor: c.aiBorder,
    },
    aiChipText: { color: c.ai, fontWeight: '900', fontSize: 12 },
    featured: {
      margin: Spacing.md,
      padding: Spacing.md,
      borderRadius: Radius.lg,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.aiBorder,
    },
    featuredHead: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
    featuredName: { fontSize: 20, fontWeight: '900', color: c.text },
    featuredMeta: { marginTop: 4, color: c.textSecondary, fontWeight: '600' },
    whyBox: {
      marginTop: Spacing.md,
      backgroundColor: c.inputBg,
      borderRadius: Radius.md,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: c.border,
    },
    whyTitle: { fontWeight: '900', color: c.ai, marginBottom: 6 },
    whyBody: { color: c.textSecondary, lineHeight: 20 },
    selectRow: {
      marginTop: Spacing.md,
      backgroundColor: c.ai,
      paddingVertical: 12,
      borderRadius: Radius.md,
      alignItems: 'center',
    },
    selectRowOn: { backgroundColor: c.primary },
    selectText: { color: '#fff', fontWeight: '900' },
    disabled: { opacity: 0.5 },
    sectionLabel: { marginHorizontal: Spacing.md, marginBottom: Spacing.sm, fontWeight: '900', color: c.text },
    tableCard: {
      marginHorizontal: Spacing.md,
      marginBottom: Spacing.sm,
      padding: Spacing.md,
      borderRadius: Radius.lg,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
    },
    tableCardMuted: { opacity: 0.55 },
    tableCardOn: { borderColor: c.primary, backgroundColor: c.primaryMuted },
    tableRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    tableName: { fontWeight: '900', color: c.text, fontSize: 16 },
    tableMeta: { marginTop: 4, color: c.textSecondary, fontSize: 13 },
    takenBadge: { backgroundColor: c.chipMuted, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
    takenBadgeText: { fontWeight: '900', fontSize: 11, color: c.textMuted },
    selectedText: { fontWeight: '900', color: c.primary },
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const restaurant = useMemo(() => (id ? getRestaurant(String(id)) : undefined), [id]);
  const tables = useMemo(() => (id ? tablesForRestaurant(String(id)) : []), [id]);
  const defaultSelected = tables.find((t) => t.aiRecommended && !t.taken)?.id ?? tables.find((t) => !t.taken)?.id;
  const [selectedId, setSelectedId] = useState<string | undefined>(defaultSelected);
  const [whyOpen, setWhyOpen] = useState(true);
  const insets = useSafeAreaInsets();

  const selected = tables.find((t) => t.id === selectedId);
  const aiTable = tables.find((t) => t.aiRecommended);

  const pick = (tid: string) => {
    setSelectedId(tid);
    if (aiTable && tid !== aiTable.id) setWhyOpen(false);
    else setWhyOpen(true);
  };

  if (!restaurant) {
    return (
      <SafeAreaView style={styles.miss}>
        <Text style={{ color: colors.text }}>Not found</Text>
      </SafeAreaView>
    );
  }

  const canReserve = selected && !selected.taken;

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

      <ScrollView contentContainerStyle={{ paddingBottom: 100 + insets.bottom }} showsVerticalScrollIndicator={false}>
        <View style={styles.aiChip}>
          <Text style={styles.aiChipText}>AI recommended for you</Text>
        </View>

        {aiTable ? (
          <View style={styles.featured}>
            <View style={styles.featuredHead}>
              <View style={{ flex: 1 }}>
                <Text style={styles.featuredName}>{aiTable.name}</Text>
                <Text style={styles.featuredMeta}>
                  {aiTable.seats} guests · {aiTable.vibes.join(' · ')}
                </Text>
              </View>
              <SeatPreviewIcon size={48} />
            </View>
            {whyOpen && selectedId === aiTable.id ? (
              <View style={styles.whyBox}>
                <Text style={styles.whyTitle}>Why we picked this</Text>
                <Text style={styles.whyBody}>{aiTable.whyReason}</Text>
              </View>
            ) : null}
            <Pressable
              onPress={() => pick(aiTable.id)}
              style={[styles.selectRow, selectedId === aiTable.id && styles.selectRowOn, aiTable.taken && styles.disabled]}>
              <Text style={styles.selectText}>{aiTable.taken ? 'Taken' : selectedId === aiTable.id ? 'Selected' : 'Select'}</Text>
            </Pressable>
          </View>
        ) : null}

        <Text style={styles.sectionLabel}>Other available tables</Text>
        {tables
          .filter((t) => !t.aiRecommended)
          .map((t) => (
            <Pressable
              key={t.id}
              onPress={() => !t.taken && pick(t.id)}
              style={[styles.tableCard, t.taken && styles.tableCardMuted, selectedId === t.id && styles.tableCardOn]}>
              <View style={styles.tableRow}>
                <SeatPreviewIcon size={40} muted={t.taken} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.tableName}>{t.name}</Text>
                  <Text style={styles.tableMeta}>
                    {t.seats} seats · {t.vibes.join(' · ')}
                  </Text>
                </View>
                {t.taken ? (
                  <View style={styles.takenBadge}>
                    <Text style={styles.takenBadgeText}>Taken</Text>
                  </View>
                ) : selectedId === t.id ? (
                  <Text style={styles.selectedText}>Selected</Text>
                ) : null}
              </View>
            </Pressable>
          ))}
      </ScrollView>

      <View style={[styles.sticky, { paddingBottom: insets.bottom + Spacing.sm }]}>
        <Pressable
          disabled={!canReserve}
          style={[styles.cta, !canReserve && { opacity: 0.4 }]}
          onPress={() =>
            router.push({
              pathname: '/booking/confirm',
              params: {
                restaurantId: String(id),
                tableName: selected?.name ?? '',
                ref: `#TRM-${Math.floor(10000 + Math.random() * 90000)}`,
              },
            })
          }>
          <Text style={styles.ctaText}>Reserve selected table</Text>
        </Pressable>
      </View>
    </View>
  );
}
