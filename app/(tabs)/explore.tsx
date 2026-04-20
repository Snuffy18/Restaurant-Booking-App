import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, InteractionManager, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AppColors } from '@/constants/Theme';
import { FontFamily, Radius, Spacing } from '@/constants/Theme';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { RESTAURANTS, Restaurant } from '@/data/mockData';
import { TabScreenFade } from '@/components/TabScreenFade';
import { consumeExploreSearchFocus } from '@/lib/exploreSearchFocus';
import { clearLastVisitedRestaurantIds, getLastVisitedRestaurantIds } from '@/lib/lastVisitedRestaurant';

type SortMode = 'nearest' | 'rating' | 'availability';
type FilterId = 'tonight' | 'cuisine' | 'price' | 'guests' | 'outdoor' | 'rating';
type AvailabilityTone = 'red' | 'orange' | 'green';
const GUEST_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

const FILTERS = [
  { id: 'tonight', label: 'Tonight' },
  { id: 'cuisine', label: 'Italian' },
  { id: 'price', label: 'Price' },
  { id: 'guests', label: 'Guests' },
  { id: 'outdoor', label: 'Outdoor' },
  { id: 'rating', label: 'Rating' },
] as const satisfies ReadonlyArray<{ id: FilterId; label: string }>;
const TOP_SEARCH_OPTIONS = ['Offers', 'Best rated', 'Italian', 'Sushi', 'Indian', 'Pizza', 'Brunch', 'Steakhouse'] as const;
const TOP_SEARCH_SUBTITLES: Record<(typeof TOP_SEARCH_OPTIONS)[number], string> = {
  Offers: 'Reso Advantages',
  'Best rated': 'Highest user ratings',
  Italian: 'Classic pasta and pizza',
  Sushi: 'Fresh rolls and sashimi',
  Indian: 'Spiced curries and tandoor',
  Pizza: 'Stone-baked favorites',
  Brunch: 'Late morning favorites',
  Steakhouse: 'Premium grilled cuts',
};
const OFFERS_PERCENT_ICON = require('../../assets/images/percent.svg');
const BEST_RATED_ICON = require('../../assets/images/fork.knife.circle.fill.svg');
const ITALIAN_ICON = require('../../assets/images/fork.knife.svg');
const SUSHI_ICON = require('../../assets/images/wineglass.fill.svg');
const INDIAN_ICON = require('../../assets/images/fork.knife.circle.fill.svg');
const PIZZA_ICON = require('../../assets/images/fork.knife.svg');

const AVAIL_PILL = {
  green: { bg: '#DCFCE7', border: '#22C55E', text: '#166534' },
  orange: { bg: '#FFEDD5', border: '#FB923C', text: '#C2410C' },
  red: { bg: '#FEE2E2', border: '#EF4444', text: '#B91C1C' },
} as const;

function buildTimeOptions(): string[] {
  const out = ['Now'];
  const now = new Date();
  const end = 23 * 60 + 30;
  const current = now.getHours() * 60 + now.getMinutes();
  let slot = Math.ceil(current / 30) * 30;
  while (slot <= end) {
    const h = String(Math.floor(slot / 60)).padStart(2, '0');
    const m = String(slot % 60).padStart(2, '0');
    out.push(`${h}:${m}`);
    slot += 30;
  }
  return out;
}

function buildDateOptions(): string[] {
  return Array.from({ length: 31 }, (_, offset) => {
    if (offset === 0) return 'Today';
    if (offset === 1) return 'Tomorrow';
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' }).replace(',', '');
  });
}

function toneForAvailabilityLeft(n: number): AvailabilityTone {
  if (n <= 1) return 'red';
  if (n <= 5) return 'orange';
  return 'green';
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    top: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
    topSearchMode: { flex: 1, backgroundColor: '#fff' },
    searchRow: { flexDirection: 'row', alignItems: 'center' },
    input: {
      flex: 1,
      backgroundColor: c.card,
      borderRadius: Radius.full,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: Spacing.md,
      paddingVertical: 12,
      fontSize: 16,
      color: c.text,
    },
    clear: { marginLeft: Spacing.sm, padding: Spacing.sm },
    clearText: { color: '#111827', fontSize: 16, fontWeight: '700' },
    searchModeScreen: { flex: 1, backgroundColor: '#fff' },
    searchModeBody: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, backgroundColor: '#fff' },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: Radius.md,
      backgroundColor: '#fff',
      paddingHorizontal: Spacing.md,
      paddingVertical: 12,
    },
    locationLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    locationText: { color: '#111827', fontWeight: '600', fontSize: 18 },
    searchInputRow: {
      marginTop: Spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: Radius.md,
      backgroundColor: '#fff',
      paddingHorizontal: Spacing.md,
      paddingVertical: 10,
    },
    searchModeInput: { flex: 1, color: '#111827', fontSize: 17, fontWeight: '600', paddingVertical: 0 },
    seeAllRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    seeAllLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    seeAllIcon: { width: 20, height: 20 },
    seeAllText: { color: '#111827', fontWeight: '700', fontSize: 18 },
    continueSectionTitle: {
      color: c.text,
      fontSize: 18,
      fontWeight: '800',
    },
    stickySectionHeader: {
      backgroundColor: c.background,
      paddingVertical: Spacing.sm,
    },
    continueSectionHeader: {
      marginTop: Spacing.md,
      marginBottom: Spacing.xs,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    clearAllText: {
      color: c.textSecondary,
      fontSize: 14,
      fontWeight: '700',
      textDecorationLine: 'underline',
    },
    continueCard: {
      flexDirection: 'row',
      backgroundColor: c.card,
      borderRadius: Radius.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.border,
    },
    continueCardImg: { width: 88, height: 88 },
    continueCardBody: { flex: 1, padding: Spacing.md, justifyContent: 'center' },
    continueCardTitle: { color: c.text, fontWeight: '800', fontSize: 16 },
    continueCardRating: { color: c.text, fontWeight: '700', fontSize: 13, marginTop: 3 },
    continueCardSub: { color: c.textSecondary, fontSize: 13, marginTop: 4 },
    continueCardsWrap: { gap: Spacing.sm },
    topSearchesWrap: { marginTop: Spacing.xs },
    topSearchOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    topSearchOptionText: {
      color: c.text,
      fontWeight: '600',
      fontSize: 17,
    },
    topSearchOptionSubtext: {
      color: c.textSecondary,
      fontSize: 13,
      marginTop: 2,
    },
    topSearchTextWrap: { justifyContent: 'center' },
    topSearchIconWrap: { paddingVertical: 5, paddingHorizontal: 5 },
    topSearchIcon: { width: 22, height: 22 },
    sectionHeader: { marginTop: Spacing.lg, marginBottom: Spacing.sm, color: '#111827', fontSize: 22, fontWeight: '900' },
    topSearchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    topSearchLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    topSearchText: { color: '#111827', fontSize: 18, fontWeight: '700' },
    topSearchSub: { color: '#6B7280', fontSize: 15, marginTop: 2 },
    tinyThumb: { width: 34, height: 34, borderRadius: 8 },
    bookingSummaryPill: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 9,
      borderRadius: Radius.full,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
    },
    bookingSummaryItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    bookingSummaryDivider: { width: 1, alignSelf: 'stretch', backgroundColor: c.border, marginVertical: 2 },
    bookingSummaryText: { color: c.text, fontWeight: '700', fontSize: 13 },
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
    filterChipActive: {
      backgroundColor: c.primaryMuted,
      borderColor: c.primary,
    },
    filterChipText: { fontFamily: FontFamily.bebasNeue, fontSize: 16, letterSpacing: 0.5, color: c.text },
    filterChipTextActive: { color: c.primary },
    filterX: { fontFamily: FontFamily.bebasNeue, color: c.textMuted, fontSize: 16, letterSpacing: 0.3 },
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
    avBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1 },
    avBadgeRed: { backgroundColor: AVAIL_PILL.red.bg, borderColor: AVAIL_PILL.red.border },
    avBadgeOrange: { backgroundColor: AVAIL_PILL.orange.bg, borderColor: AVAIL_PILL.orange.border },
    avBadgeGreen: { backgroundColor: AVAIL_PILL.green.bg, borderColor: AVAIL_PILL.green.border },
    avBadgeText: { fontSize: 11, fontWeight: '700' },
    avBadgeTextRed: { color: AVAIL_PILL.red.text },
    avBadgeTextOrange: { color: AVAIL_PILL.orange.text },
    avBadgeTextGreen: { color: AVAIL_PILL.green.text },
    rowMeta: { marginTop: 4, color: c.textSecondary, fontSize: 13 },
    tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: Spacing.sm },
    tag: { backgroundColor: c.inputBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
    tagText: { fontSize: 11, fontWeight: '600', color: c.textSecondary },
    skeletonRow: {
      height: 108,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      overflow: 'hidden',
      marginBottom: Spacing.sm,
    },
    skeletonShimmer: { ...StyleSheet.absoluteFillObject, width: '55%' },
    skeletonImage: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 96,
      backgroundColor: c.inputBg,
      overflow: 'hidden',
    },
    skeletonContent: { marginLeft: 108, marginTop: Spacing.md, marginRight: Spacing.md, gap: Spacing.sm },
    skeletonLine: { height: 12, borderRadius: Radius.sm, backgroundColor: c.inputBg, overflow: 'hidden' },
    pickerOverlay: { flex: 1, justifyContent: 'flex-end' },
    pickerBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000' },
    pickerCard: {
      backgroundColor: c.background,
      borderTopLeftRadius: Radius.lg,
      borderTopRightRadius: Radius.lg,
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.md,
      gap: Spacing.md,
    },
    pickerTitle: { color: c.text, fontWeight: '900', fontSize: 18, textAlign: 'center' },
    guestsScroller: { marginBottom: Spacing.xs },
    guestsScrollerContent: { gap: Spacing.sm, paddingVertical: Spacing.xs },
    pickerTwoColRow: { flexDirection: 'row', gap: Spacing.sm },
    pickerCol: { flex: 1 },
    pickerWheelBlock: {
      borderRadius: Radius.md,
      backgroundColor: c.inputBg,
      overflow: 'hidden',
    },
    pickerWheel: { height: 170, width: '100%' },
    pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    pickerChip: {
      paddingHorizontal: Spacing.md,
      paddingVertical: 8,
      borderRadius: Radius.full,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.inputBg,
    },
    pickerChipOn: { backgroundColor: c.primaryMuted, borderColor: c.primary },
    pickerChipText: { color: c.textSecondary, fontWeight: '700' },
    pickerChipTextOn: { color: c.primary },
    pickerActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
    pickerBtnGhost: {
      flex: 1,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: Radius.md,
      paddingVertical: 12,
      alignItems: 'center',
      backgroundColor: c.card,
    },
    pickerBtnGhostText: { color: c.textSecondary, fontWeight: '800' },
    pickerBtnPrimary: {
      flex: 1,
      borderRadius: Radius.md,
      paddingVertical: 12,
      alignItems: 'center',
      backgroundColor: c.primary,
    },
    pickerBtnPrimaryText: { color: '#fff', fontWeight: '900' },
  });
}

type ExploreStyles = ReturnType<typeof createStyles>;

function RestaurantRow({
  restaurant: r,
  styles,
  onPressRestaurant,
}: {
  restaurant: Restaurant;
  styles: ExploreStyles;
  onPressRestaurant: (restaurantId: string) => void;
}) {
  const grey = r.fullTonight;
  const tone = r.availabilityTonight != null ? toneForAvailabilityLeft(r.availabilityTonight) : null;
  return (
    <Pressable style={[styles.row, grey && styles.rowGrey]} onPress={() => onPressRestaurant(r.id)}>
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
            <View
              style={[
                styles.avBadge,
                tone === 'red' ? styles.avBadgeRed : tone === 'orange' ? styles.avBadgeOrange : styles.avBadgeGreen,
              ]}>
              <Text
                style={[
                  styles.avBadgeText,
                  tone === 'red' ? styles.avBadgeTextRed : tone === 'orange' ? styles.avBadgeTextOrange : styles.avBadgeTextGreen,
                ]}>
                {r.availabilityTonight} left
              </Text>
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

function SearchSkeleton({
  styles,
  shimmerColors,
}: {
  styles: ExploreStyles;
  shimmerColors: [string, string, string];
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1100,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-140, 240],
  });

  const renderShimmer = () => (
    <Animated.View style={[styles.skeletonShimmer, { transform: [{ translateX }] }]}>
      <LinearGradient
        colors={shimmerColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );

  return (
    <>
      {[0, 1, 2, 3].map((idx) => (
        <View key={`sk-${idx}`} style={styles.skeletonRow}>
          <View style={styles.skeletonImage}>{renderShimmer()}</View>
          <View style={styles.skeletonContent}>
            <View style={[styles.skeletonLine, { width: '60%' }]}>{renderShimmer()}</View>
            <View style={[styles.skeletonLine, { width: '35%' }]}>{renderShimmer()}</View>
            <View style={[styles.skeletonLine, { width: '72%' }]}>{renderShimmer()}</View>
          </View>
        </View>
      ))}
    </>
  );
}

export default function ExploreScreen() {
  const { colors, resolvedScheme } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const timeOptions = useMemo(() => buildTimeOptions(), []);
  const dateOptions = useMemo(() => buildDateOptions(), []);
  const searchInputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortMode>('nearest');
  const [activeFilters, setActiveFilters] = useState<FilterId[]>([]);
  const [showSearchSkeleton, setShowSearchSkeleton] = useState(false);
  const [reservationModalOpen, setReservationModalOpen] = useState(false);
  const [reservationModalMounted, setReservationModalMounted] = useState(false);
  const [reservationDate, setReservationDate] = useState('Today');
  const [reservationTime, setReservationTime] = useState(timeOptions[0] ?? 'Now');
  const [reservationGuests, setReservationGuests] = useState<(typeof GUEST_OPTIONS)[number]>(2);
  const [draftReservationDate, setDraftReservationDate] = useState('Today');
  const [draftReservationTime, setDraftReservationTime] = useState(timeOptions[0] ?? 'Now');
  const [draftReservationGuests, setDraftReservationGuests] = useState<(typeof GUEST_OPTIONS)[number]>(2);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(520)).current;

  const toggleFilter = useCallback((id: FilterId) => {
    setActiveFilters((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  }, []);

  const onPressRestaurant = useCallback(
    (restaurantId: string) => {
      setSelectedRestaurantId(restaurantId);
      setDraftReservationDate(reservationDate);
      setDraftReservationTime(reservationTime);
      setDraftReservationGuests(reservationGuests);
      setReservationModalOpen(true);
    },
    [reservationDate, reservationTime, reservationGuests],
  );

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

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        const lastVisitedIds = await getLastVisitedRestaurantIds();
        if (!active) return;
        const restaurants = lastVisitedIds
          .map((restaurantId) => RESTAURANTS.find((item) => item.id === restaurantId) ?? null)
          .filter((item): item is (typeof RESTAURANTS)[number] => Boolean(item));
        setLastVisitedRestaurants(restaurants);
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  const results = useMemo(() => {
    if (!query.trim()) return [];

    let list = [...RESTAURANTS];
    const q = query.toLowerCase();
    list = list.filter((r) => r.name.toLowerCase().includes(q) || r.cuisine.some((c) => c.toLowerCase().includes(q)));
    if (activeFilters.includes('tonight')) {
      list = list.filter((r) => r.openNow && !r.fullTonight);
    }
    if (activeFilters.includes('cuisine')) {
      list = list.filter((r) => r.cuisine.some((c) => c.toLowerCase().includes('italian')));
    }
    if (activeFilters.includes('price')) {
      list = list.filter((r) => r.price === '££');
    }
    if (activeFilters.includes('guests')) {
      list = list.filter((r) => !r.fullTonight && (r.availabilityTonight ?? 0) >= 2);
    }
    if (activeFilters.includes('outdoor')) {
      list = list.filter(
        (r) =>
          r.vibes.some((v) => v.toLowerCase().includes('outdoor')) ||
          r.facilities.some((f) => f.toLowerCase().includes('outdoor')),
      );
    }
    if (activeFilters.includes('rating')) {
      list = list.filter((r) => r.rating >= 4.7);
    }
    if (sort === 'nearest') list.sort((a, b) => a.distanceKm - b.distanceKm);
    if (sort === 'rating') list.sort((a, b) => b.rating - a.rating);
    if (sort === 'availability') {
      list.sort((a, b) => (b.availabilityTonight ?? -1) - (a.availabilityTonight ?? -1));
    }
    return list;
  }, [query, sort, activeFilters]);

  const cycleSort = () => {
    setSort((s) => (s === 'nearest' ? 'rating' : s === 'rating' ? 'availability' : 'nearest'));
  };

  const sortLabel = sort === 'nearest' ? 'Nearest first' : sort === 'rating' ? 'Rating' : 'Availability';
  const hasQuery = query.trim().length > 0;
  const [lastVisitedRestaurants, setLastVisitedRestaurants] = useState<(typeof RESTAURANTS)[number][]>([]);
  const [topSearchIconFailures, setTopSearchIconFailures] = useState<Partial<Record<(typeof TOP_SEARCH_OPTIONS)[number], boolean>>>({});
  const openRestaurant = useCallback(
    (restaurantId: string, extraParams?: { date?: string; time?: string; guests?: string }) => {
      const restaurant = RESTAURANTS.find((item) => item.id === restaurantId) ?? null;
      setLastVisitedRestaurants((prev) => {
        if (!restaurant) return prev;
        return [restaurant, ...prev.filter((item) => item.id !== restaurant.id)].slice(0, 2);
      });
      setQuery('');
      setSelectedRestaurantId(null);
      setShowSearchSkeleton(false);
      router.push({
        pathname: '/restaurant/[id]',
        params: {
          id: restaurantId,
          ...extraParams,
        },
      });
    },
    [],
  );
  const onClearLastVisited = useCallback(() => {
    Alert.alert('Clear continue exploring?', 'This will remove your last visited restaurant from this section.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear all',
        style: 'destructive',
        onPress: () => {
          setLastVisitedRestaurants([]);
          void clearLastVisitedRestaurantIds();
        },
      },
    ]);
  }, []);
  const topSearchIcons = useMemo(
    () => ({
      Offers: OFFERS_PERCENT_ICON,
      'Best rated': BEST_RATED_ICON,
      Italian: ITALIAN_ICON,
      Sushi: SUSHI_ICON,
      Indian: INDIAN_ICON,
      Pizza: PIZZA_ICON,
      Brunch: SUSHI_ICON,
      Steakhouse: BEST_RATED_ICON,
    }),
    [],
  );
  const topSearchFallbackIcons = useMemo(
    () => ({
      Offers: 'tag',
      'Best rated': 'star',
      Italian: 'cutlery',
      Sushi: 'glass',
      Indian: 'cutlery',
      Pizza: 'cutlery',
      Brunch: 'coffee',
      Steakhouse: 'cutlery',
    }) satisfies Record<(typeof TOP_SEARCH_OPTIONS)[number], React.ComponentProps<typeof FontAwesome>['name']>,
    [],
  );
  const stickyHeaderIndices = useMemo(() => {
    if (hasQuery) return [] as number[];
    return lastVisitedRestaurants.length > 0 ? [1, 3] : [1];
  }, [hasQuery, lastVisitedRestaurants.length]);
  const shimmerColors = useMemo<[string, string, string]>(
    () =>
      resolvedScheme === 'light'
        ? ['rgba(255,255,255,0)', 'rgba(255,255,255,0.72)', 'rgba(255,255,255,0)']
        : ['rgba(255,255,255,0)', 'rgba(255,255,255,0.30)', 'rgba(255,255,255,0)'],
    [resolvedScheme],
  );

  useEffect(() => {
    if (!query.trim()) {
      setShowSearchSkeleton(false);
      setReservationModalOpen(false);
      return;
    }
    setShowSearchSkeleton(true);
    const timer = setTimeout(() => setShowSearchSkeleton(false), 550);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (reservationModalOpen) {
      setReservationModalMounted(true);
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(backdropOpacity, { toValue: 0.35, duration: 180, useNativeDriver: true }),
          Animated.spring(sheetTranslateY, {
            toValue: 0,
            damping: 22,
            stiffness: 230,
            mass: 0.9,
            useNativeDriver: true,
          }),
        ]).start();
      });
      return;
    }
    if (!reservationModalMounted) return;
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(sheetTranslateY, { toValue: 520, duration: 230, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) setReservationModalMounted(false);
    });
  }, [reservationModalOpen, reservationModalMounted, backdropOpacity, sheetTranslateY]);

  return (
    <TabScreenFade>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.top}>
        <View style={styles.searchRow}>
          <TextInput
            ref={searchInputRef}
            style={styles.input}
            placeholder="Type of food, restaurant name..."
            placeholderTextColor="#6B7280"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 ? (
            <Pressable
              onPress={() => {
                setQuery('');
              }}
              style={styles.clear}>
              <Text style={styles.clearText}>✕</Text>
            </Pressable>
          ) : null}
        </View>
        <Pressable
          style={styles.bookingSummaryPill}
          onPress={() => {
            setSelectedRestaurantId(null);
            setDraftReservationDate(reservationDate);
            setDraftReservationTime(reservationTime);
            setDraftReservationGuests(reservationGuests);
            setReservationModalOpen(true);
          }}
          accessibilityRole="button"
          accessibilityLabel="Change date, time and guests">
          <View style={styles.bookingSummaryItem}>
            <FontAwesome name="calendar-o" size={13} color={colors.primary} />
            <Text style={styles.bookingSummaryText}>{reservationDate}</Text>
            <FontAwesome name="chevron-down" size={12} color={colors.primary} />
          </View>
          <View style={styles.bookingSummaryDivider} />
          <View style={styles.bookingSummaryItem}>
            <FontAwesome name="clock-o" size={13} color={colors.primary} />
            <Text style={styles.bookingSummaryText}>{reservationTime}</Text>
            <FontAwesome name="chevron-down" size={12} color={colors.primary} />
          </View>
          <View style={styles.bookingSummaryDivider} />
          <View style={styles.bookingSummaryItem}>
            <FontAwesome name="users" size={13} color={colors.primary} />
            <Text style={styles.bookingSummaryText}>{reservationGuests} guests</Text>
            <FontAwesome name="chevron-down" size={12} color={colors.primary} />
          </View>
        </Pressable>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          contentContainerStyle={styles.filterRow}>
          {FILTERS.map((f) => (
            <Pressable
              key={f.id}
              onPress={() => toggleFilter(f.id)}
              style={[styles.filterChip, activeFilters.includes(f.id) && styles.filterChipActive]}>
              <Text style={[styles.filterChipText, activeFilters.includes(f.id) && styles.filterChipTextActive]}>{f.label}</Text>
              {activeFilters.includes(f.id) ? <Text style={styles.filterX}> ✕</Text> : null}
            </Pressable>
          ))}
        </ScrollView>
        {hasQuery ? (
          <View style={styles.resultRow}>
            <Text style={styles.resultCount}>{results.length} restaurants</Text>
            <Pressable onPress={cycleSort} style={styles.sortBtn}>
              <Text style={styles.sortText}>{sortLabel}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={stickyHeaderIndices}
        keyboardShouldPersistTaps="always">
        {!hasQuery ? (
          <Pressable
            style={styles.seeAllRow}
            onPress={() => router.push('/explore/all')}
            accessibilityRole="button"
            accessibilityLabel="See all restaurants">
            <View style={styles.seeAllLeft}>
              <Ionicons name="restaurant" size={20} color={colors.primary} />
              <Text style={styles.seeAllText}>See all restaurants</Text>
            </View>
            <FontAwesome name="chevron-right" size={16} color={colors.primary} />
          </Pressable>
        ) : null}
        {!hasQuery && lastVisitedRestaurants.length > 0 ? (
          <View style={styles.stickySectionHeader}>
            <View style={styles.continueSectionHeader}>
              <Text style={styles.continueSectionTitle}>Continue exploring</Text>
              <Pressable onPress={onClearLastVisited} accessibilityRole="button" accessibilityLabel="Clear last visited">
                <Text style={styles.clearAllText}>Clear all</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
        {!hasQuery && lastVisitedRestaurants.length > 0 ? (
          <View style={styles.continueCardsWrap}>
            {lastVisitedRestaurants.map((restaurant) => (
              <Pressable
                key={restaurant.id}
                style={styles.continueCard}
                onPress={() => router.push({ pathname: '/restaurant/[id]', params: { id: restaurant.id } })}
                accessibilityRole="button"
                accessibilityLabel={`Open ${restaurant.name}`}>
                <Image source={{ uri: restaurant.image }} style={styles.continueCardImg} contentFit="cover" />
                <View style={styles.continueCardBody}>
                  <Text style={styles.continueCardTitle} numberOfLines={1}>
                    {restaurant.name}
                  </Text>
                  <Text style={styles.continueCardRating}>★ {restaurant.rating.toFixed(1)} ({restaurant.reviewCount})</Text>
                  <Text style={styles.continueCardSub} numberOfLines={1}>
                    📍 {restaurant.address} • {restaurant.distanceKm.toFixed(1)} km • Closes {restaurant.closingTime}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}
        {!hasQuery ? (
          <View style={styles.stickySectionHeader}>
            <Text style={styles.continueSectionTitle}>Top searches</Text>
          </View>
        ) : null}
        {!hasQuery ? (
          <View style={styles.topSearchesWrap}>
            {TOP_SEARCH_OPTIONS.map((option) => (
              <Pressable
                key={option}
                style={styles.topSearchOption}
                onPress={() => setQuery(option)}
                accessibilityRole="button"
                accessibilityLabel={`Search ${option}`}>
                <View style={styles.seeAllLeft}>
                  <View style={styles.topSearchIconWrap}>
                      {option === 'Steakhouse' ? (
                        <MaterialCommunityIcons name="food-steak" size={20} color={colors.primary} />
                      ) : option === 'Offers' ? (
                        <MaterialIcons name="local-offer" size={20} color={colors.primary} />
                      ) : option === 'Best rated' ? (
                        <MaterialIcons name="trending-up" size={20} color={colors.primary} />
                      ) : option === 'Brunch' ? (
                        <MaterialIcons name="brunch-dining" size={20} color={colors.primary} />
                      ) : option === 'Pizza' ? (
                        <FontAwesome5 name="pizza-slice" size={18} color={colors.primary} />
                      ) : option === 'Indian' ? (
                        <AntDesign name="fire" size={19} color={colors.primary} />
                      ) : option === 'Italian' ? (
                        <MaterialCommunityIcons name="pasta" size={20} color={colors.primary} />
                      ) : topSearchIconFailures[option] ? (
                        <FontAwesome name={topSearchFallbackIcons[option]} size={16} color={colors.primary} />
                      ) : (
                        <Image
                          source={topSearchIcons[option]}
                          style={[styles.topSearchIcon, { tintColor: colors.primary }]}
                          contentFit="contain"
                          onError={() => setTopSearchIconFailures((prev) => ({ ...prev, [option]: true }))}
                        />
                      )}
                  </View>
                  <View style={styles.topSearchTextWrap}>
                    <Text style={styles.topSearchOptionText}>{option}</Text>
                    <Text style={styles.topSearchOptionSubtext}>{TOP_SEARCH_SUBTITLES[option]}</Text>
                  </View>
                </View>
                <FontAwesome name="chevron-right" size={16} color={colors.primary} />
              </Pressable>
            ))}
          </View>
        ) : null}
        {showSearchSkeleton ? (
          <SearchSkeleton styles={styles} shimmerColors={shimmerColors} />
        ) : (
          results.map((r) => (
            <RestaurantRow key={r.id} restaurant={r} styles={styles} onPressRestaurant={onPressRestaurant} />
          ))
        )}
        </ScrollView>
      </SafeAreaView>
      <Modal visible={reservationModalMounted} transparent animationType="none" onRequestClose={() => setReservationModalOpen(false)}>
        <Pressable style={styles.pickerOverlay} onPress={() => setReservationModalOpen(false)}>
          <Animated.View pointerEvents="none" style={[styles.pickerBackdrop, { opacity: backdropOpacity }]} />
          <Animated.View style={{ transform: [{ translateY: sheetTranslateY }] }}>
            <Pressable style={[styles.pickerCard, { paddingBottom: insets.bottom + Spacing.lg }]} onPress={() => {}}>
            <Text style={styles.pickerTitle}>What time do you want to reserve a table for?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.guestsScroller} contentContainerStyle={styles.guestsScrollerContent}>
              {GUEST_OPTIONS.map((g) => (
                <Pressable
                  key={g}
                  onPress={() => setDraftReservationGuests(g)}
                  style={[styles.pickerChip, draftReservationGuests === g && styles.pickerChipOn]}>
                  <Text style={[styles.pickerChipText, draftReservationGuests === g && styles.pickerChipTextOn]}>{g} guest{g > 1 ? 's' : ''}</Text>
                </Pressable>
              ))}
            </ScrollView>
            {Platform.OS === 'ios' ? (
              <View style={styles.pickerTwoColRow}>
                <View style={styles.pickerCol}>
                  <View style={styles.pickerWheelBlock}>
                    <Picker
                      selectedValue={draftReservationDate}
                      onValueChange={(v) => setDraftReservationDate(String(v))}
                      itemStyle={{ color: resolvedScheme === 'light' ? '#000' : '#fff' }}
                      style={styles.pickerWheel}>
                      {dateOptions.map((date) => (
                        <Picker.Item key={date} label={date} value={date} />
                      ))}
                    </Picker>
                  </View>
                </View>
                <View style={styles.pickerCol}>
                  <View style={styles.pickerWheelBlock}>
                    <Picker
                      selectedValue={draftReservationTime}
                      onValueChange={(v) => setDraftReservationTime(String(v))}
                      itemStyle={{ color: resolvedScheme === 'light' ? '#000' : '#fff' }}
                      style={styles.pickerWheel}>
                      {timeOptions.map((time) => (
                        <Picker.Item key={time} label={time} value={time} />
                      ))}
                    </Picker>
                  </View>
                </View>
              </View>
            ) : (
              <>
                <View style={styles.pickerRow}>
                  {dateOptions.map((date) => (
                    <Pressable
                      key={date}
                      onPress={() => setDraftReservationDate(date)}
                      style={[styles.pickerChip, draftReservationDate === date && styles.pickerChipOn]}>
                      <Text style={[styles.pickerChipText, draftReservationDate === date && styles.pickerChipTextOn]}>{date}</Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.pickerRow}>
                  {timeOptions.map((time) => (
                    <Pressable
                      key={time}
                      onPress={() => setDraftReservationTime(time)}
                      style={[styles.pickerChip, draftReservationTime === time && styles.pickerChipOn]}>
                      <Text style={[styles.pickerChipText, draftReservationTime === time && styles.pickerChipTextOn]}>{time}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
            <View style={styles.pickerActions}>
              <Pressable
                style={styles.pickerBtnGhost}
                onPress={() => {
                  setReservationModalOpen(false);
                  if (selectedRestaurantId) {
                    openRestaurant(selectedRestaurantId);
                  }
                }}>
                <Text style={styles.pickerBtnGhostText}>Skip</Text>
              </Pressable>
              <Pressable
                style={styles.pickerBtnPrimary}
                onPress={() => {
                  setReservationDate(draftReservationDate);
                  setReservationTime(draftReservationTime);
                  setReservationGuests(draftReservationGuests);
                  setReservationModalOpen(false);
                  if (selectedRestaurantId) {
                    openRestaurant(selectedRestaurantId, {
                      date: draftReservationDate,
                      time: draftReservationTime,
                      guests: String(draftReservationGuests),
                    });
                  }
                }}>
                <Text style={styles.pickerBtnPrimaryText}>Apply</Text>
              </Pressable>
            </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </TabScreenFade>
  );
}
