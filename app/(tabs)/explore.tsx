import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { InteractionManager, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AppColors } from '@/constants/Theme';
import { Radius, Spacing } from '@/constants/Theme';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { RESTAURANTS, Restaurant } from '@/data/mockData';
import { consumeExploreSearchFocus } from '@/lib/exploreSearchFocus';

type SortMode = 'nearest' | 'rating' | 'availability';

const FILTERS = [
  { id: 'tonight', label: 'Tonight' },
  { id: 'cuisine', label: 'Italian', active: true },
  { id: 'price', label: 'Price' },
  { id: 'guests', label: 'Guests' },
  { id: 'outdoor', label: 'Outdoor' },
  { id: 'rating', label: 'Rating' },
] as const;

function createStyles(c: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    top: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
    searchRow: { flexDirection: 'row', alignItems: 'center' },
    input: {
      flex: 1,
      backgroundColor: c.card,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: Spacing.md,
      paddingVertical: 12,
      fontSize: 16,
      color: c.text,
    },
    clear: { marginLeft: Spacing.sm, padding: Spacing.sm },
    clearText: { color: c.textSecondary, fontSize: 16, fontWeight: '700' },
    filterRow: { gap: Spacing.sm, paddingVertical: Spacing.xs },
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: 8,
      borderRadius: Radius.full,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
    },
    filterChipText: { fontWeight: '600', color: c.text },
    filterX: { color: c.textMuted, fontWeight: '700' },
    resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
    resultCount: { fontWeight: '700', color: c.textSecondary },
    sortBtn: { paddingVertical: 4, paddingHorizontal: Spacing.sm },
    sortText: { fontWeight: '700', color: c.primary },
    list: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl, gap: Spacing.sm },
    activePill: {
      alignSelf: 'flex-start',
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: Spacing.md,
      paddingVertical: 6,
      borderRadius: Radius.full,
      marginBottom: Spacing.sm,
    },
    activePillText: { fontWeight: '600', color: c.text },
    row: {
      flexDirection: 'row',
      backgroundColor: c.card,
      borderRadius: Radius.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.border,
    },
    rowGrey: { opacity: 0.85 },
    rowImg: { width: 96, height: 96 },
    rowBody: { flex: 1, padding: Spacing.md },
    rowTop: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm, alignItems: 'center' },
    rowName: { flex: 1, fontWeight: '800', fontSize: 16, color: c.text },
    fullBadge: { backgroundColor: c.chipMuted, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
    fullBadgeText: { fontSize: 11, fontWeight: '700', color: c.textMuted },
    avBadge: { backgroundColor: c.primaryMuted, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
    avBadgeText: { fontSize: 11, fontWeight: '700', color: c.primary },
    rowMeta: { marginTop: 4, color: c.textSecondary, fontSize: 13 },
    tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: Spacing.sm },
    tag: { backgroundColor: c.inputBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
    tagText: { fontSize: 11, fontWeight: '600', color: c.textSecondary },
  });
}

type ExploreStyles = ReturnType<typeof createStyles>;

function RestaurantRow({ restaurant: r, styles }: { restaurant: Restaurant; styles: ExploreStyles }) {
  const grey = r.fullTonight;
  return (
    <Pressable style={[styles.row, grey && styles.rowGrey]} onPress={() => router.push(`/restaurant/${r.id}`)}>
      <Image source={{ uri: r.image }} style={styles.rowImg} contentFit="cover" />
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={styles.rowName} numberOfLines={1}>
            {r.name}
          </Text>
          {r.fullTonight ? (
            <View style={styles.fullBadge}>
              <Text style={styles.fullBadgeText}>Full tonight</Text>
            </View>
          ) : r.availabilityTonight != null ? (
            <View style={styles.avBadge}>
              <Text style={styles.avBadgeText}>{r.availabilityTonight} left</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.rowMeta}>
          {r.openNow ? 'Open' : 'Closed'} · {r.rating} ★ ({r.reviewCount})
        </Text>
        <View style={styles.tags}>
          {r.vibes.slice(0, 2).map((v) => (
            <View key={v} style={styles.tag}>
              <Text style={styles.tagText}>{v}</Text>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

export default function ExploreScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const searchInputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortMode>('nearest');

  useFocusEffect(
    useCallback(() => {
      if (!consumeExploreSearchFocus()) return undefined;

      let cancelled = false;
      const task = InteractionManager.runAfterInteractions(() => {
        if (cancelled) return;
        searchInputRef.current?.focus();
      });

      return () => {
        cancelled = true;
        if (task && typeof (task as { cancel?: () => void }).cancel === 'function') {
          (task as { cancel: () => void }).cancel();
        }
      };
    }, []),
  );

  const results = useMemo(() => {
    let list = [...RESTAURANTS];
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((r) => r.name.toLowerCase().includes(q) || r.cuisine.some((c) => c.toLowerCase().includes(q)));
    }
    if (sort === 'nearest') list.sort((a, b) => a.distanceKm - b.distanceKm);
    if (sort === 'rating') list.sort((a, b) => b.rating - a.rating);
    if (sort === 'availability') {
      list.sort((a, b) => (b.availabilityTonight ?? -1) - (a.availabilityTonight ?? -1));
    }
    return list;
  }, [query, sort]);

  const cycleSort = () => {
    setSort((s) => (s === 'nearest' ? 'rating' : s === 'rating' ? 'availability' : 'nearest'));
  };

  const sortLabel = sort === 'nearest' ? 'Nearest first' : sort === 'rating' ? 'Rating' : 'Availability';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.top}>
        <View style={styles.searchRow}>
          <TextInput
            ref={searchInputRef}
            style={styles.input}
            placeholder="Search"
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} style={styles.clear}>
              <Text style={styles.clearText}>✕</Text>
            </Pressable>
          ) : null}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map((f) => (
            <Pressable key={f.id} style={styles.filterChip}>
              <Text style={styles.filterChipText}>{f.label}</Text>
              {'active' in f && f.active ? (
                <Text style={styles.filterX}>
                  {' '}
                  ✕
                </Text>
              ) : null}
            </Pressable>
          ))}
        </ScrollView>
        <View style={styles.resultRow}>
          <Text style={styles.resultCount}>{results.length} restaurants</Text>
          <Pressable onPress={cycleSort} style={styles.sortBtn}>
            <Text style={styles.sortText}>{sortLabel}</Text>
          </Pressable>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <View style={styles.activePill}>
          <Text style={styles.activePillText}>
            Italian <Text style={styles.filterX}>✕</Text>
          </Text>
        </View>
        {results.map((r) => (
          <RestaurantRow key={r.id} restaurant={r} styles={styles} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
