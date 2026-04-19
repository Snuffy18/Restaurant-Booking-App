import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Theme, Radius, Spacing } from '@/constants/Theme';
import { MOCK_USER, RESTAURANTS, Restaurant } from '@/data/mockData';

const FILTER_CHIPS = ['All', 'Italian', 'Japanese', 'Romantic', 'Family', 'Outdoor'];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const availableTonight = RESTAURANTS.filter((r) => !r.fullTonight && r.openNow);
  const nearYou = [...RESTAURANTS].sort((a, b) => a.distanceKm - b.distanceKm);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.greeting}>
          {greeting()}, {MOCK_USER.firstName}
        </Text>
        <View style={styles.searchRow}>
          <Pressable style={styles.searchBox} onPress={() => router.push('/explore')}>
            <Text style={styles.searchPlaceholder}>Search restaurants, cuisines…</Text>
          </Pressable>
          <Pressable style={styles.filterIcon} onPress={() => router.push('/explore')}>
            <Text style={styles.filterGlyph}>⚙</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hChips}>
          {FILTER_CHIPS.map((c) => (
            <View key={c} style={styles.hChip}>
              <Text style={styles.hChipText}>{c}</Text>
            </View>
          ))}
        </ScrollView>

        <Link href="/ai-chat" asChild>
          <Pressable style={({ pressed }) => [styles.aiBanner, pressed && { opacity: 0.95 }]}>
            <Text style={styles.aiBannerTitle}>Not sure where to go?</Text>
            <Text style={styles.aiBannerSub}>Ask AI — describe the night you want in plain language.</Text>
          </Pressable>
        </Link>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Available tonight</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hCards}>
          {availableTonight.map((r) => (
            <RestaurantCardHorizontal key={r.id} restaurant={r} />
          ))}
        </ScrollView>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Near you</Text>
        </View>
        {nearYou.map((r) => (
          <RestaurantCardVertical key={r.id} restaurant={r} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function RestaurantCardHorizontal({ restaurant: r }: { restaurant: Restaurant }) {
  const left = r.availabilityTonight != null ? `${r.availabilityTonight} left` : 'Ask';
  return (
    <Pressable style={styles.hCard} onPress={() => router.push(`/restaurant/${r.id}`)}>
      <Image source={{ uri: r.image }} style={styles.hImage} contentFit="cover" />
      <View style={styles.hBadge}>
        <Text style={styles.hBadgeText}>{left}</Text>
      </View>
      <Text style={styles.hName} numberOfLines={1}>
        {r.name}
      </Text>
      <Text style={styles.hMeta} numberOfLines={1}>
        {r.cuisine.join(' · ')} · {r.price}
      </Text>
    </Pressable>
  );
}

function RestaurantCardVertical({ restaurant: r }: { restaurant: Restaurant }) {
  const status = r.openNow ? 'Open' : 'Closed';
  const statusColor = r.openNow ? Theme.primary : Theme.textMuted;
  return (
    <Pressable style={styles.vCard} onPress={() => router.push(`/restaurant/${r.id}`)}>
      <Image source={{ uri: r.image }} style={styles.vImage} contentFit="cover" />
      <View style={styles.vBody}>
        <View style={styles.vTop}>
          <Text style={styles.vName} numberOfLines={1}>
            {r.name}
          </Text>
          <Text style={[styles.vStatus, { color: statusColor }]}>{status}</Text>
        </View>
        <Text style={styles.vMeta} numberOfLines={1}>
          {r.cuisine.join(' · ')} · {r.distanceKm.toFixed(1)} km
        </Text>
        {r.fullTonight ? (
          <View style={styles.fullBadge}>
            <Text style={styles.fullBadgeText}>Full tonight</Text>
          </View>
        ) : r.availabilityTonight != null ? (
          <View style={styles.softBadge}>
            <Text style={styles.softBadgeText}>{r.availabilityTonight} tables left tonight</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.background },
  scroll: { paddingBottom: Spacing.xl },
  greeting: { fontSize: 22, fontWeight: '800', color: Theme.text, paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  searchBox: {
    flex: 1,
    backgroundColor: Theme.card,
    borderRadius: Radius.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  searchPlaceholder: { color: Theme.textMuted, fontSize: 16 },
  filterIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Theme.card,
    borderWidth: 1,
    borderColor: Theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterGlyph: { fontSize: 20 },
  hChips: { gap: Spacing.sm, paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
  hChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Theme.card,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  hChipText: { fontWeight: '600', color: Theme.text },
  aiBanner: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Theme.aiMuted,
    borderWidth: 1,
    borderColor: '#D4CFF5',
  },
  aiBannerTitle: { fontWeight: '800', color: Theme.ai, fontSize: 16, marginBottom: 4 },
  aiBannerSub: { color: Theme.textSecondary, lineHeight: 20 },
  sectionHead: { paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Theme.text },
  hCards: { gap: Spacing.md, paddingHorizontal: Spacing.md, marginBottom: Spacing.lg },
  hCard: {
    width: 220,
    backgroundColor: Theme.card,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.border,
  },
  hImage: { width: '100%', height: 120 },
  hBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(17,24,39,0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  hBadgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  hName: { paddingHorizontal: Spacing.md, marginTop: Spacing.sm, fontWeight: '800', color: Theme.text, fontSize: 16 },
  hMeta: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, color: Theme.textSecondary, fontSize: 13 },
  vCard: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Theme.card,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.border,
  },
  vImage: { width: 104, height: 104 },
  vBody: { flex: 1, padding: Spacing.md },
  vTop: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm },
  vName: { flex: 1, fontWeight: '800', fontSize: 16, color: Theme.text },
  vStatus: { fontWeight: '700', fontSize: 12 },
  vMeta: { marginTop: 4, color: Theme.textSecondary, fontSize: 13 },
  fullBadge: {
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  fullBadgeText: { fontSize: 11, fontWeight: '700', color: Theme.textMuted },
  softBadge: {
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
    backgroundColor: Theme.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  softBadgeText: { fontSize: 11, fontWeight: '700', color: Theme.primary },
});
