import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Theme, Radius, Spacing } from '@/constants/Theme';
import { RESTAURANTS, Restaurant } from '@/data/mockData';

type SortMode = 'nearest' | 'rating' | 'availability';

const FILTERS = [
  { id: 'tonight', label: 'Tonight' },
  { id: 'cuisine', label: 'Italian', active: true },
  { id: 'price', label: 'Price' },
  { id: 'guests', label: 'Guests' },
  { id: 'outdoor', label: 'Outdoor' },
  { id: 'rating', label: 'Rating' },
] as const;

export default function ExploreScreen() {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortMode>('nearest');

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
            style={styles.input}
            placeholder="Search"
            placeholderTextColor={Theme.textMuted}
            value={query}
            onChangeText={setQuery}
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
          <RestaurantRow key={r.id} restaurant={r} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function RestaurantRow({ restaurant: r }: { restaurant: Restaurant }) {
  const grey = r.fullTonight;
  return (
    <Pressable
      style={[styles.row, grey && styles.rowGrey]}
      onPress={() => router.push(`/restaurant/${r.id}`)}>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.background },
  top: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
  searchRow: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: Theme.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Theme.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: Theme.text,
  },
  clear: { marginLeft: Spacing.sm, padding: Spacing.sm },
  clearText: { color: Theme.textSecondary, fontSize: 16, fontWeight: '700' },
  filterRow: { gap: Spacing.sm, paddingVertical: Spacing.xs },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Theme.card,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  filterChipText: { fontWeight: '600', color: Theme.text },
  filterX: { color: Theme.textMuted, fontWeight: '700' },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  resultCount: { fontWeight: '700', color: Theme.textSecondary },
  sortBtn: { paddingVertical: 4, paddingHorizontal: Spacing.sm },
  sortText: { fontWeight: '700', color: Theme.primary },
  list: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl, gap: Spacing.sm },
  activePill: {
    alignSelf: 'flex-start',
    backgroundColor: Theme.card,
    borderWidth: 1,
    borderColor: Theme.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    marginBottom: Spacing.sm,
  },
  activePillText: { fontWeight: '600', color: Theme.text },
  row: {
    flexDirection: 'row',
    backgroundColor: Theme.card,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.border,
  },
  rowGrey: { opacity: 0.85 },
  rowImg: { width: 96, height: 96 },
  rowBody: { flex: 1, padding: Spacing.md },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm, alignItems: 'center' },
  rowName: { flex: 1, fontWeight: '800', fontSize: 16, color: Theme.text },
  fullBadge: { backgroundColor: '#E5E7EB', paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
  fullBadgeText: { fontSize: 11, fontWeight: '700', color: Theme.textMuted },
  avBadge: { backgroundColor: Theme.primaryMuted, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
  avBadgeText: { fontSize: 11, fontWeight: '700', color: Theme.primary },
  rowMeta: { marginTop: 4, color: Theme.textSecondary, fontSize: 13 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: Spacing.sm },
  tag: { backgroundColor: Theme.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
  tagText: { fontSize: 11, fontWeight: '600', color: Theme.textSecondary },
});
