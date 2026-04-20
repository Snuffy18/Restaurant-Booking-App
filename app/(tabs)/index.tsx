import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated as RNAnimated, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AppColors } from '@/constants/Theme';
import { Radius, Spacing } from '@/constants/Theme';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { MOCK_USER, RESTAURANTS, Restaurant } from '@/data/mockData';
import { AiHomeBanner } from '@/components/AiHomeBanner';
import { BitesIcon } from '@/components/BitesIcon';
import { TabScreenFade } from '@/components/TabScreenFade';
import { requestExploreSearchFocus } from '@/lib/exploreSearchFocus';

const FILTER_CHIPS = ['All', 'Italian', 'Japanese', 'Romantic', 'Family', 'Outdoor'];
const CURRENT_BITES = 340;

/** “Tables left” pills — semantic green/red only, not app accent */
const AVAIL_PILL = {
  green: { bg: '#DCFCE7', border: '#22C55E', text: '#166534' },
  orange: { bg: '#FFEDD5', border: '#FB923C', text: '#C2410C' },
  red: { bg: '#FEE2E2', border: '#EF4444', text: '#B91C1C' },
} as const;

type AvailabilityTone = 'red' | 'orange' | 'green';

function toneForAvailabilityLeft(n: number): AvailabilityTone {
  if (n <= 1) return 'red';
  if (n <= 5) return 'orange';
  return 'green';
}

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
      borderRadius: Radius.full,
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
    hChipText: { fontSize: 14, fontWeight: '600', color: c.text },
    aiBannerSection: {
      paddingHorizontal: Spacing.md,
      marginTop: Spacing.md,
      marginBottom: Spacing.lg,
    },
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
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: Radius.full,
    },
    /** “Ask” / unknown availability on horizontal card */
    hBadgeNeutral: { backgroundColor: c.badgeScrim },
    hBadgeTextNeutral: { color: '#fff', fontWeight: '700', fontSize: 12 },
    hBadgeGreen: {
      backgroundColor: AVAIL_PILL.green.bg,
      borderWidth: 1,
      borderColor: AVAIL_PILL.green.border,
    },
    hBadgeOrange: {
      backgroundColor: AVAIL_PILL.orange.bg,
      borderWidth: 1,
      borderColor: AVAIL_PILL.orange.border,
    },
    hBadgeTextGreen: { color: AVAIL_PILL.green.text, fontWeight: '700', fontSize: 12 },
    hBadgeTextOrange: { color: AVAIL_PILL.orange.text, fontWeight: '700', fontSize: 12 },
    hBadgeRed: {
      backgroundColor: AVAIL_PILL.red.bg,
      borderWidth: 1,
      borderColor: AVAIL_PILL.red.border,
    },
    hBadgeTextRed: { color: AVAIL_PILL.red.text, fontWeight: '700', fontSize: 12 },
    hName: {
      paddingHorizontal: Spacing.md,
      marginTop: Spacing.sm,
      fontWeight: '800',
      fontSize: 16,
      color: c.text,
    },
    hMeta: {
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.md,
      color: c.textSecondary,
      fontSize: 13,
    },
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
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: Radius.full,
      borderWidth: 1,
    },
    softBadgeGreen: {
      backgroundColor: AVAIL_PILL.green.bg,
      borderColor: AVAIL_PILL.green.border,
    },
    softBadgeOrange: {
      backgroundColor: AVAIL_PILL.orange.bg,
      borderColor: AVAIL_PILL.orange.border,
    },
    softBadgeRed: {
      backgroundColor: AVAIL_PILL.red.bg,
      borderColor: AVAIL_PILL.red.border,
    },
    softBadgeTextGreen: { fontSize: 11, fontWeight: '700', color: AVAIL_PILL.green.text },
    softBadgeTextOrange: { fontSize: 11, fontWeight: '700', color: AVAIL_PILL.orange.text },
    softBadgeTextRed: { fontSize: 11, fontWeight: '700', color: AVAIL_PILL.red.text },
    bitesSection: { marginHorizontal: Spacing.md, marginTop: Spacing.md },
    bitesCard: {
      backgroundColor: c.card,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: Spacing.md,
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: Spacing.md,
    },
    bitesInfo: { flex: 1 },
    bitesLabel: { color: '#4e0110', fontSize: 13, fontWeight: '700' },
    bitesAmount: { color: '#4e0110', fontSize: 26, fontWeight: '900', marginTop: 6 },
    bitesModalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.35)',
    },
    bitesModalCard: {
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: Radius.lg,
      borderTopRightRadius: Radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      height: '90%',
      overflow: 'hidden',
    },
    bitesDragHandleWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.xs,
      backgroundColor: '#FFFFFF',
    },
    bitesDragHandle: {
      width: 44,
      height: 5,
      borderRadius: Radius.full,
      backgroundColor: '#D1D5DB',
    },
    bitesModalHeader: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
    },
    bitesModalHeaderTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    bitesModalTitle: { color: '#111827', fontSize: 24, fontWeight: '900' },
    bitesRewardsBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    bitesRewardsText: { color: '#111827', fontSize: 14, fontWeight: '700' },
    bitesTabs: { flexDirection: 'row', marginTop: Spacing.sm },
    bitesTab: { flex: 1, alignItems: 'center', paddingVertical: 8 },
    bitesTabText: { color: '#6B7280', fontSize: 15, fontWeight: '600' },
    bitesTabActiveText: { color: '#F4A62A', fontWeight: '800' },
    bitesTabActiveUnderline: { marginTop: 8, height: 2, width: '82%', backgroundColor: '#F4A62A', borderRadius: 1 },
    bitesModalScroll: { flex: 1, backgroundColor: '#FFFFFF' },
    bitesSummaryBlock: { backgroundColor: '#E9DDC9', alignItems: 'center', padding: Spacing.md },
    bitesSummaryAmountRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    bitesSummaryAmount: { color: '#2A2218', fontSize: 42, fontWeight: '900' },
    bitesSummaryLabel: { color: '#4B3A29', fontSize: 15, marginTop: 4, fontWeight: '600' },
    bitesProgressCard: {
      marginTop: Spacing.md,
      width: '100%',
      backgroundColor: '#F2C574',
      borderRadius: Radius.md,
      padding: Spacing.sm,
      gap: Spacing.sm,
    },
    bitesProgressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    bitesProgressLabel: { color: '#4A3416', fontSize: 13, fontWeight: '700' },
    bitesProgressStat: { color: '#4A3416', fontSize: 13, fontWeight: '800' },
    bitesProgressTrack: { height: 8, backgroundColor: '#E9B558', borderRadius: 99, overflow: 'hidden' },
    bitesProgressFill: { height: '100%', width: '68%', backgroundColor: '#D59A2A' },
    bitesProgressHint: { color: '#4A3416', fontSize: 12, fontWeight: '600' },
    bitesRedeemSection: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.lg, gap: Spacing.sm, backgroundColor: '#FFFFFF' },
    bitesRedeemTitle: { color: '#111827', fontSize: 22, fontWeight: '900' },
    rewardCard: {
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: Radius.lg,
      padding: Spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    rewardIconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: '#DCEEE7',
      alignItems: 'center',
      justifyContent: 'center',
    },
    rewardIconText: { fontSize: 18 },
    rewardBody: { flex: 1 },
    rewardTitle: { color: '#111827', fontSize: 18, fontWeight: '800' },
    rewardDesc: { color: '#6B7280', fontSize: 14, marginTop: 2 },
    rewardPill: {
      marginTop: Spacing.sm,
      alignSelf: 'flex-start',
      backgroundColor: '#F5E7CF',
      borderRadius: Radius.full,
      paddingHorizontal: 10,
      paddingVertical: 3,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    rewardPillText: { color: '#4A3416', fontSize: 13, fontWeight: '700' },
    rewardArrowBtn: {
      width: 34,
      height: 34,
      borderRadius: 20,
      backgroundColor: '#23A877',
      alignItems: 'center',
      justifyContent: 'center',
    },
    rewardArrowText: { color: '#fff', fontSize: 16, fontWeight: '900' },
    bitesModalText: { color: c.textSecondary, fontSize: 14, lineHeight: 20 },
  });
}

type HomeStyles = ReturnType<typeof createStyles>;

function RestaurantCardHorizontal({ restaurant: r, styles }: { restaurant: Restaurant; styles: HomeStyles }) {
  const n = r.availabilityTonight;
  const left = n != null ? `${n} left` : 'Ask';
  const tone = n != null ? toneForAvailabilityLeft(n) : null;
  const pillStyle =
    tone === 'red'
      ? [styles.hBadge, styles.hBadgeRed]
      : tone === 'orange'
        ? [styles.hBadge, styles.hBadgeOrange]
        : tone === 'green'
          ? [styles.hBadge, styles.hBadgeGreen]
          : [styles.hBadge, styles.hBadgeNeutral];
  const pillTextStyle =
    tone === 'red'
      ? styles.hBadgeTextRed
      : tone === 'orange'
        ? styles.hBadgeTextOrange
        : tone === 'green'
          ? styles.hBadgeTextGreen
          : styles.hBadgeTextNeutral;
  return (
    <Pressable style={styles.hCard} onPress={() => router.push(`/restaurant/${r.id}`)}>
      <Image source={{ uri: r.image }} style={styles.hImage} contentFit="cover" />
      <View style={pillStyle}>
        <Text style={pillTextStyle}>{left}</Text>
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
          <View
            style={[
              styles.softBadge,
              toneForAvailabilityLeft(r.availabilityTonight) === 'red'
                ? styles.softBadgeRed
                : toneForAvailabilityLeft(r.availabilityTonight) === 'orange'
                  ? styles.softBadgeOrange
                  : styles.softBadgeGreen,
            ]}>
            <Text
              style={
                toneForAvailabilityLeft(r.availabilityTonight) === 'red'
                  ? styles.softBadgeTextRed
                  : toneForAvailabilityLeft(r.availabilityTonight) === 'orange'
                    ? styles.softBadgeTextOrange
                    : styles.softBadgeTextGreen
              }>
              {r.availabilityTonight} tables left tonight
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [bitesModalOpen, setBitesModalOpen] = useState(false);
  const bitesSheetTranslateY = useRef(new RNAnimated.Value(0)).current;
  const availableTonight = RESTAURANTS.filter((r) => !r.fullTonight && r.openNow);
  const nearYou = [...RESTAURANTS].sort((a, b) => a.distanceKm - b.distanceKm);

  useEffect(() => {
    if (bitesModalOpen) {
      bitesSheetTranslateY.setValue(0);
    }
  }, [bitesModalOpen, bitesSheetTranslateY]);

  const closeBitesModal = () => {
    RNAnimated.timing(bitesSheetTranslateY, {
      toValue: 520,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setBitesModalOpen(false);
      bitesSheetTranslateY.setValue(0);
    });
  };

  const bitesPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 4,
      onPanResponderMove: (_, gestureState) => {
        bitesSheetTranslateY.setValue(Math.max(0, gestureState.dy));
      },
      onPanResponderRelease: (_, gestureState) => {
        const shouldClose = gestureState.dy > 120 || gestureState.vy > 1.2;
        if (shouldClose) {
          closeBitesModal();
          return;
        }
        RNAnimated.spring(bitesSheetTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 18,
          stiffness: 220,
          mass: 0.8,
        }).start();
      },
      onPanResponderTerminate: () => {
        RNAnimated.spring(bitesSheetTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 18,
          stiffness: 220,
          mass: 0.8,
        }).start();
      },
    }),
  ).current;

  return (
    <TabScreenFade>
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
          <AiHomeBanner />
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
        <View style={styles.bitesSection}>
          <Pressable style={styles.bitesCard} onPress={() => setBitesModalOpen(true)} accessibilityRole="button" accessibilityLabel="Open Bites details">
            <View style={styles.bitesInfo}>
              <Text style={styles.bitesLabel}>Your current Bites amount</Text>
              <Text style={styles.bitesAmount}>{CURRENT_BITES}</Text>
            </View>
            <BitesIcon size={34} color="#EF9F27" backgroundColor={colors.card} />
          </Pressable>
        </View>
        </ScrollView>
      </SafeAreaView>

    </TabScreenFade>
  );
}
