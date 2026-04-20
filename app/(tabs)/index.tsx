import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AppColors } from '@/constants/Theme';
import { Radius, Spacing } from '@/constants/Theme';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { MOCK_USER, RESTAURANTS, Restaurant } from '@/data/mockData';
import { requestExploreSearchFocus } from '@/lib/exploreSearchFocus';

const FILTER_CHIPS = ['All', 'Italian', 'Japanese', 'Romantic', 'Family', 'Outdoor'];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    scroll: { paddingBottom: Spacing.xl },
    greeting: { fontSize: 22, fontWeight: '800', color: c.text, paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
    searchBox: {
      flex: 1,
      backgroundColor: c.card,
      borderRadius: Radius.md,
      paddingVertical: 14,
      paddingHorizontal: Spacing.md,
      borderWidth: 1,
      borderColor: c.border,
    },
    searchPlaceholder: { color: c.textMuted, fontSize: 16 },
    filterIcon: {
      width: 48,
      height: 48,
      borderRadius: Radius.md,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterGlyph: { fontSize: 20, color: c.text },
    hChips: { gap: Spacing.sm, paddingHorizontal: Spacing.md, marginBottom: 0 },
    hChip: {
      paddingHorizontal: Spacing.md,
      paddingVertical: 8,
      borderRadius: Radius.full,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
    },
    hChipText: { fontWeight: '600', color: c.text },
    aiBannerSection: {
      paddingHorizontal: Spacing.md,
      marginTop: Spacing.md,
      marginBottom: Spacing.lg,
    },
    aiBannerInner: {
      borderRadius: Radius.lg,
      backgroundColor: c.aiMuted,
      borderWidth: 1,
      borderColor: c.aiBorder,
      overflow: 'hidden',
    },
    aiBannerCopy: {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
    },
    aiBannerHead: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.md,
    },
    aiSparkles: {
      width: 32,
      height: 32,
      marginTop: 2,
      tintColor: c.text,
    },
    aiBannerTextCol: {
      flex: 1,
      gap: Spacing.sm,
    },
    aiBannerTitle: { fontWeight: '800', color: c.ai, fontSize: 16, lineHeight: 22 },
    aiBannerSub: { color: c.textSecondary, lineHeight: 22, fontSize: 15 },
    sectionHead: { paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: c.text },
    hCards: { gap: Spacing.md, paddingHorizontal: Spacing.md, marginBottom: Spacing.lg },
    hCard: {
      width: 220,
      backgroundColor: c.card,
      borderRadius: Radius.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.border,
    },
    hImage: { width: '100%', height: 120 },
    hBadge: {
      position: 'absolute',
      top: Spacing.sm,
      right: Spacing.sm,
      backgroundColor: c.badgeScrim,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: Radius.full,
    },
    hBadgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
    hName: { paddingHorizontal: Spacing.md, marginTop: Spacing.sm, fontWeight: '800', color: c.text, fontSize: 16 },
    hMeta: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, color: c.textSecondary, fontSize: 13 },
    vCard: {
      flexDirection: 'row',
      marginHorizontal: Spacing.md,
      marginBottom: Spacing.md,
      backgroundColor: c.card,
      borderRadius: Radius.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.border,
    },
    vImage: { width: 104, height: 104 },
    vBody: { flex: 1, padding: Spacing.md },
    vTop: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm },
    vName: { flex: 1, fontWeight: '800', fontSize: 16, color: c.text },
    vStatus: { fontWeight: '700', fontSize: 12 },
    vMeta: { marginTop: 4, color: c.textSecondary, fontSize: 13 },
    fullBadge: {
      alignSelf: 'flex-start',
      marginTop: Spacing.sm,
      backgroundColor: c.chipMuted,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: Radius.full,
    },
    fullBadgeText: { fontSize: 11, fontWeight: '700', color: c.textMuted },
    softBadge: {
      alignSelf: 'flex-start',
      marginTop: Spacing.sm,
      backgroundColor: c.primaryMuted,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: Radius.full,
    },
    softBadgeText: { fontSize: 11, fontWeight: '700', color: c.primary },
  });
}

type HomeStyles = ReturnType<typeof createStyles>;

function RestaurantCardHorizontal({ restaurant: r, styles }: { restaurant: Restaurant; styles: HomeStyles }) {
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

function RestaurantCardVertical({
  restaurant: r,
  styles,
  colors,
}: {
  restaurant: Restaurant;
  styles: HomeStyles;
  colors: AppColors;
}) {
  const status = r.openNow ? 'Open' : 'Closed';
  const statusColor = r.openNow ? colors.primary : colors.textMuted;
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

export default function HomeScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const availableTonight = RESTAURANTS.filter((r) => !r.fullTonight && r.openNow);
  const nearYou = [...RESTAURANTS].sort((a, b) => a.distanceKm - b.distanceKm);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.greeting}>
          {greeting()}, {MOCK_USER.firstName}
        </Text>
        <View style={styles.searchRow}>
          <Pressable
            style={styles.searchBox}
            onPress={() => {
              requestExploreSearchFocus();
              router.push('/explore');
            }}>
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

        <View style={styles.aiBannerSection}>
          <Link href="/ai-chat" asChild>
            <Pressable style={({ pressed }) => [styles.aiBannerInner, pressed && { opacity: 0.95 }]}>
              <View style={styles.aiBannerCopy}>
                <View style={styles.aiBannerHead}>
                  <Image
                    source={require('../../assets/images/ai-sparkles.png')}
                    style={styles.aiSparkles}
                    contentFit="contain"
                    accessibilityLabel="AI"
                  />
                  <View style={styles.aiBannerTextCol}>
                    <Text style={styles.aiBannerTitle}>Not sure where to go?</Text>
                    <Text style={styles.aiBannerSub}>
                      Ask AI — describe the night you want in plain language.
                    </Text>
                  </View>
                </View>
              </View>
            </Pressable>
          </Link>
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Available tonight</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hCards}>
          {availableTonight.map((r) => (
            <RestaurantCardHorizontal key={r.id} restaurant={r} styles={styles} />
          ))}
        </ScrollView>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Near you</Text>
        </View>
        {nearYou.map((r) => (
          <RestaurantCardVertical key={r.id} restaurant={r} styles={styles} colors={colors} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
