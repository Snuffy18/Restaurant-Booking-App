import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Theme, Radius, Spacing } from '@/constants/Theme';
import { getRestaurant } from '@/data/mockData';

type Tab = 'overview' | 'menu' | 'reviews' | 'info';

export default function RestaurantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const restaurant = useMemo(() => (id ? getRestaurant(String(id)) : undefined), [id]);
  const [tab, setTab] = useState<Tab>('overview');
  const [favourite, setFavourite] = useState(false);
  const insets = useSafeAreaInsets();

  if (!restaurant) {
    return (
      <SafeAreaView style={styles.miss}>
        <Text style={styles.missText}>Restaurant not found.</Text>
        <Pressable onPress={() => router.back()} style={styles.primaryBtn}>
          <Text style={styles.primaryLabel}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const open = restaurant.openNow;

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}>
        <View style={styles.heroWrap}>
          <Image source={{ uri: restaurant.image }} style={styles.hero} contentFit="cover" />
          <SafeAreaView edges={['top']} style={styles.heroBar}>
            <Pressable style={styles.iconBtn} onPress={() => router.back()}>
              <FontAwesome name="chevron-left" size={20} color="#fff" />
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={() => setFavourite((f) => !f)}>
              <FontAwesome name="heart" size={22} color={favourite ? '#FF4D4D' : '#fff'} />
            </Pressable>
          </SafeAreaView>
        </View>

        <View style={styles.pad}>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{restaurant.name}</Text>
            <View style={[styles.openBadge, !open && styles.closedBadge]}>
              <Text style={[styles.openText, !open && styles.closedText]}>{open ? 'Open' : 'Closed'}</Text>
            </View>
          </View>
          <Text style={styles.rating}>
            {restaurant.rating} ★ · {restaurant.reviewCount} reviews
          </Text>
          <View style={styles.pills}>
            {restaurant.cuisine.map((c) => (
              <View key={c} style={styles.pill}>
                <Text style={styles.pillText}>{c}</Text>
              </View>
            ))}
            <View style={styles.pill}>
              <Text style={styles.pillText}>{restaurant.price}</Text>
            </View>
            {restaurant.vibes.slice(0, 2).map((v) => (
              <View key={v} style={[styles.pill, styles.pillMuted]}>
                <Text style={styles.pillTextMuted}>{v}</Text>
              </View>
            ))}
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoText}>{restaurant.address}</Text>
            <Text style={styles.infoText}>
              · {restaurant.distanceKm.toFixed(1)} km · Closes {restaurant.closingTime}
            </Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
            {(
              [
                ['overview', 'Overview'],
                ['menu', 'Menu'],
                ['reviews', 'Reviews'],
                ['info', 'Info'],
              ] as const
            ).map(([k, label]) => (
              <Pressable key={k} onPress={() => setTab(k)} style={[styles.tab, tab === k && styles.tabOn]}>
                <Text style={[styles.tabLabel, tab === k && styles.tabLabelOn]}>{label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {tab === 'overview' ? (
            <View style={styles.section}>
              <Text style={styles.about}>{restaurant.about}</Text>
              <Text style={styles.sectionHeading}>Vibe</Text>
              <View style={styles.vibeGrid}>
                {restaurant.vibes.concat(['Cosy', 'Quiet']).slice(0, 4).map((v) => (
                  <View key={v} style={styles.vibeCard}>
                    <Text style={styles.vibeCardText}>{v}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.sectionHeading}>Top reviews</Text>
              {restaurant.reviews.slice(0, 2).map((r) => (
                <View key={r.id} style={styles.reviewCard}>
                  <Text style={styles.reviewAuthor}>{r.author}</Text>
                  <Text style={styles.reviewBody}>{r.text}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {tab === 'menu' ? (
            <View style={styles.section}>
              {restaurant.menu.map((cat) => (
                <View key={cat.category} style={{ marginBottom: Spacing.lg }}>
                  <Text style={styles.menuCat}>{cat.category}</Text>
                  {cat.items.map((it) => (
                    <View key={it.name} style={styles.menuRow}>
                      <Text style={styles.menuItem}>{it.name}</Text>
                      <Text style={styles.menuPrice}>{it.price}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ) : null}

          {tab === 'reviews' ? (
            <View style={styles.section}>
              <View style={styles.breakdown}>
                {[5, 4, 3, 2, 1].map((star) => (
                  <View key={star} style={styles.breakRow}>
                    <Text style={styles.breakLabel}>{star}★</Text>
                    <View style={styles.breakBar}>
                      <View style={[styles.breakFill, { width: `${20 + star * 12}%` }]} />
                    </View>
                  </View>
                ))}
              </View>
              {restaurant.reviews.map((r) => (
                <View key={r.id} style={styles.reviewCard}>
                  <Text style={styles.reviewAuthor}>
                    {r.author} · {r.rating} ★
                  </Text>
                  <Text style={styles.reviewBody}>{r.text}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {tab === 'info' ? (
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>Hours</Text>
              {restaurant.hours.map((h) => (
                <View key={h.day} style={styles.menuRow}>
                  <Text style={styles.menuItem}>{h.day}</Text>
                  <Text style={styles.menuPrice}>{h.hours}</Text>
                </View>
              ))}
              <Text style={[styles.sectionHeading, { marginTop: Spacing.lg }]}>Contact</Text>
              <Text style={styles.about}>{restaurant.phone}</Text>
              <Text style={[styles.sectionHeading, { marginTop: Spacing.lg }]}>Facilities</Text>
              {restaurant.facilities.map((f) => (
                <Text key={f} style={styles.bullet}>
                  • {f}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.sticky, { paddingBottom: insets.bottom + Spacing.sm }]}>
        <View style={styles.stickyInner}>
          <View>
            <Text style={styles.stickyLabel}>Tonight · 19:30</Text>
            <Text style={styles.stickySub}>2 guests · Tap to change</Text>
          </View>
          <Pressable style={styles.reserveBtn} onPress={() => router.push(`/restaurant/${id}/seats`)}>
            <Text style={styles.reserveBtnText}>Reserve</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.background },
  miss: { flex: 1, backgroundColor: Theme.background, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  missText: { color: Theme.textSecondary, marginBottom: Spacing.md },
  heroWrap: { position: 'relative' },
  hero: { width: '100%', height: 240 },
  heroBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pad: { padding: Spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  name: { flex: 1, fontSize: 26, fontWeight: '900', color: Theme.text },
  openBadge: { backgroundColor: Theme.primaryMuted, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  closedBadge: { backgroundColor: '#F3F4F6' },
  openText: { color: Theme.primary, fontWeight: '800', fontSize: 12 },
  closedText: { color: Theme.textMuted },
  rating: { marginTop: 6, color: Theme.textSecondary, fontWeight: '600' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: Spacing.md },
  pill: { backgroundColor: Theme.card, borderWidth: 1, borderColor: Theme.border, paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.full },
  pillMuted: { backgroundColor: Theme.background },
  pillText: { fontWeight: '700', color: Theme.text, fontSize: 12 },
  pillTextMuted: { fontWeight: '700', color: Theme.textSecondary, fontSize: 12 },
  infoRow: { marginTop: Spacing.md },
  infoText: { color: Theme.textSecondary, lineHeight: 20 },
  tabRow: { gap: Spacing.sm, marginTop: Spacing.lg, marginBottom: Spacing.md },
  tab: { paddingHorizontal: Spacing.md, paddingVertical: 10, borderRadius: Radius.full, backgroundColor: Theme.card, borderWidth: 1, borderColor: Theme.border },
  tabOn: { borderColor: Theme.primary, backgroundColor: Theme.primaryMuted },
  tabLabel: { fontWeight: '700', color: Theme.textSecondary },
  tabLabelOn: { color: Theme.primary },
  section: { paddingBottom: Spacing.md },
  sectionHeading: { fontWeight: '900', color: Theme.text, marginBottom: Spacing.sm, marginTop: Spacing.md },
  about: { color: Theme.textSecondary, lineHeight: 22, fontSize: 15 },
  vibeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  vibeCard: {
    width: '48%',
    backgroundColor: Theme.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  vibeCardText: { fontWeight: '800', color: Theme.text },
  reviewCard: {
    backgroundColor: Theme.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Theme.border,
    marginBottom: Spacing.sm,
  },
  reviewAuthor: { fontWeight: '800', color: Theme.text, marginBottom: 6 },
  reviewBody: { color: Theme.textSecondary, lineHeight: 20 },
  menuCat: { fontWeight: '900', fontSize: 16, marginBottom: Spacing.sm, color: Theme.text },
  menuRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md, marginBottom: Spacing.sm },
  menuItem: { flex: 1, color: Theme.text, fontWeight: '600' },
  menuPrice: { color: Theme.textSecondary, fontWeight: '700' },
  breakdown: { marginBottom: Spacing.md },
  breakRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 6 },
  breakLabel: { width: 28, color: Theme.textMuted, fontSize: 12 },
  breakBar: { flex: 1, height: 8, backgroundColor: Theme.border, borderRadius: 4, overflow: 'hidden' },
  breakFill: { height: '100%', backgroundColor: Theme.primary },
  bullet: { color: Theme.textSecondary, marginBottom: 6 },
  sticky: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Theme.card,
    borderTopWidth: 1,
    borderTopColor: Theme.border,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  stickyInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  stickyLabel: { fontWeight: '900', color: Theme.text },
  stickySub: { color: Theme.textSecondary, marginTop: 2, fontSize: 12 },
  reserveBtn: {
    backgroundColor: Theme.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderRadius: Radius.md,
  },
  reserveBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  primaryBtn: {
    backgroundColor: Theme.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderRadius: Radius.md,
  },
  primaryLabel: { color: '#fff', fontWeight: '800' },
});
