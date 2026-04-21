import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Picker } from '@react-native-picker/picker';
import LottieView from 'lottie-react-native';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated as RNAnimated, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, interpolate, LinearTransition, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BookingSummaryPill } from '@/components/BookingSummaryPill';
import type { AppColors } from '@/constants/Theme';
import { Radius, Spacing } from '@/constants/Theme';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { RESTAURANTS } from '@/data/mockData';
import { getReservationPreferences, setReservationPreferences } from '@/lib/reservationPreferences';

type FilterId = 'tonight' | 'cuisine' | 'price' | 'guests' | 'outdoor' | 'rating';
type AvailabilityTone = 'red' | 'orange' | 'green';

const AVAIL_PILL = {
  green: { bg: '#DCFCE7', border: '#22C55E', text: '#166534' },
  orange: { bg: '#FFEDD5', border: '#FB923C', text: '#C2410C' },
  red: { bg: '#FEE2E2', border: '#EF4444', text: '#B91C1C' },
} as const;

const FILTERS = [
  { id: 'tonight', label: 'Tonight' },
  { id: 'cuisine', label: 'Italian' },
  { id: 'price', label: 'Price' },
  { id: 'guests', label: 'Guests' },
  { id: 'outdoor', label: 'Outdoor' },
  { id: 'rating', label: 'Rating' },
] as const satisfies ReadonlyArray<{ id: FilterId; label: string }>;

const GUEST_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
const PINCH_HINT_SEEN_KEY = 'allRestaurantsPinchHintSeen';
const ZOOM_IN_ANIMATION = require('../../assets/images/Zoom In.json');

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
    headerWrap: {
      backgroundColor: c.background,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    top: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
    searchRow: { flexDirection: 'row', alignItems: 'center' },
    backBtn: { padding: Spacing.xs, marginRight: Spacing.xs },
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
    filterChipText: { fontSize: 14, color: c.text, fontWeight: '600' },
    filterChipTextActive: { color: c.primary },
    filterX: { color: c.textMuted, fontSize: 14 },
    list: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl, gap: Spacing.sm, paddingTop: 20 },
    pickerOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
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
      backgroundColor: c.card,
    },
    pickerChipOn: {
      borderColor: c.primary,
      backgroundColor: c.primaryMuted,
    },
    pickerChipText: { color: c.text, fontWeight: '700' },
    pickerChipTextOn: { color: c.primary },
    pickerActions: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm, marginTop: Spacing.sm },
    pickerBtnGhost: {
      flex: 1,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: Radius.md,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.card,
    },
    pickerBtnGhostText: { color: c.text, fontWeight: '700' },
    pickerBtnPrimary: {
      flex: 1,
      borderRadius: Radius.md,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.primary,
    },
    pickerBtnPrimaryText: { color: '#fff', fontWeight: '800' },
    row: {
      flexDirection: 'row',
      backgroundColor: c.card,
      borderRadius: Radius.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.border,
    },
    rowDetailed: {
      flexDirection: 'column',
    },
    rowImgWrap: { width: 104, height: 104 },
    rowImgWrapDetailed: { width: '100%', height: 190 },
    rowImg: { width: '100%', height: '100%' },
    rowBody: { flex: 1, padding: Spacing.md },
    rowBodyDetailed: { paddingTop: Spacing.sm },
    rowTop: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm },
    rowName: { flex: 1, fontWeight: '800', fontSize: 16, color: c.text },
    rowStatus: { fontWeight: '700', fontSize: 12 },
    rowMeta: { marginTop: 4, color: c.textSecondary, fontSize: 13 },
    rowExtra: { marginTop: 6, color: c.textSecondary, fontSize: 12, lineHeight: 17 },
    reviewLabel: { marginTop: Spacing.sm, color: c.text, fontWeight: '800', fontSize: 12 },
    reviewText: { marginTop: 4, color: c.textSecondary, fontSize: 13, lineHeight: 18 },
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
    pinchHintOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.65)',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.lg,
      zIndex: 30,
    },
    pinchHintCard: {
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      alignItems: 'center',
      gap: Spacing.sm,
      width: '100%',
      maxWidth: 340,
    },
    pinchHintLottie: { width: 256, height: 256 },
    pinchHintTitle: { color: c.text, fontWeight: '800', fontSize: 16, textAlign: 'center' },
    pinchHintSub: { color: c.textSecondary, fontSize: 13, textAlign: 'center' },
    pinchHintSkeletonWrap: {
      width: Math.max(230, 340 - Spacing.lg * 2),
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: '#F3F4F6',
      overflow: 'hidden',
      marginTop: Spacing.xs,
    },
    pinchHintSkeletonStage: { position: 'relative' },
    pinchHintSkeletonImage: { position: 'absolute', backgroundColor: '#E5E7EB' },
    pinchHintSkeletonPills: { position: 'absolute', gap: 6 },
    pinchHintSkeletonLine: { height: 10, borderRadius: Radius.sm, backgroundColor: '#D1D5DB' },
    pinchHintSkeletonLineShort: { width: '42%' },
    pinchHintSkeletonLineMedium: { width: '68%' },
    pinchHintSkeletonBadge: { width: '54%', height: 14, borderRadius: Radius.full, backgroundColor: '#D1D5DB', marginTop: 2 },
  });
}

export default function AllRestaurantsScreen() {
  const { colors, resolvedScheme } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const timeOptions = useMemo(() => buildTimeOptions(), []);
  const dateOptions = useMemo(() => buildDateOptions(), []);
  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<FilterId[]>([]);
  const [reservationModalOpen, setReservationModalOpen] = useState(false);
  const [reservationModalMounted, setReservationModalMounted] = useState(false);
  const [reservationDate, setReservationDate] = useState('Today');
  const [reservationTime, setReservationTime] = useState(timeOptions[0] ?? 'Now');
  const [reservationGuests, setReservationGuests] = useState<(typeof GUEST_OPTIONS)[number]>(2);
  const [draftReservationDate, setDraftReservationDate] = useState('Today');
  const [draftReservationTime, setDraftReservationTime] = useState(timeOptions[0] ?? 'Now');
  const [draftReservationGuests, setDraftReservationGuests] = useState<(typeof GUEST_OPTIONS)[number]>(2);
  const [detailedCards, setDetailedCards] = useState(false);
  const [showPinchHint, setShowPinchHint] = useState(true);
  const morphProgress = useSharedValue(0);
  const pinchHintOpacity = useSharedValue(0);
  const pinchHintMorph = useSharedValue(0);
  const modalBackdropOpacity = useRef(new RNAnimated.Value(0)).current;
  const modalSheetTranslateY = useRef(new RNAnimated.Value(520)).current;
  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchHandledRef = useRef(false);
  const isPinchingRef = useRef(false);
  const suppressCardPressUntilRef = useRef(0);

  const toggleFilter = (id: FilterId) => {
    setActiveFilters((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };

  const results = useMemo(() => {
    let list = [...RESTAURANTS];
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((r) => r.name.toLowerCase().includes(q) || r.cuisine.some((c) => c.toLowerCase().includes(q)));
    }
    if (activeFilters.includes('tonight')) list = list.filter((r) => r.openNow && !r.fullTonight);
    if (activeFilters.includes('cuisine')) list = list.filter((r) => r.cuisine.some((c) => c.toLowerCase().includes('italian')));
    if (activeFilters.includes('price')) list = list.filter((r) => r.price === '££');
    if (activeFilters.includes('guests')) list = list.filter((r) => !r.fullTonight && (r.availabilityTonight ?? 0) >= 2);
    if (activeFilters.includes('outdoor')) {
      list = list.filter(
        (r) =>
          r.vibes.some((v) => v.toLowerCase().includes('outdoor')) ||
          r.facilities.some((f) => f.toLowerCase().includes('outdoor')),
      );
    }
    if (activeFilters.includes('rating')) list = list.filter((r) => r.rating >= 4.7);
    return list;
  }, [query, activeFilters]);

  useEffect(() => {
    let active = true;
    void (async () => {
      const saved = await getReservationPreferences();
      if (!active || !saved) return;
      const nextTime = timeOptions.includes(saved.time) ? saved.time : timeOptions[0] ?? 'Now';
      const nextGuests = GUEST_OPTIONS.includes(saved.guests as (typeof GUEST_OPTIONS)[number])
        ? (saved.guests as (typeof GUEST_OPTIONS)[number])
        : 2;
      setReservationDate(saved.date);
      setReservationTime(nextTime);
      setReservationGuests(nextGuests);
      setDraftReservationDate(saved.date);
      setDraftReservationTime(nextTime);
      setDraftReservationGuests(nextGuests);
    })();
    return () => {
      active = false;
    };
  }, [timeOptions]);

  useEffect(() => {
    morphProgress.value = withTiming(detailedCards ? 1 : 0, {
      duration: 180,
      easing: Easing.out(Easing.cubic),
    });
  }, [detailedCards, morphProgress]);

  useEffect(() => {
    let active = true;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;
    void (async () => {
      const seen = await AsyncStorage.getItem(PINCH_HINT_SEEN_KEY);
      if (!active || seen === '1') return;
      setShowPinchHint(true);
      await AsyncStorage.setItem(PINCH_HINT_SEEN_KEY, '1');
      hideTimer = setTimeout(() => {
        pinchHintOpacity.value = withTiming(0, { duration: 180 });
        setTimeout(() => {
          if (active) setShowPinchHint(false);
        }, 200);
      }, 2600);
    })();
    return () => {
      active = false;
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [pinchHintOpacity]);

  useEffect(() => {
    if (!showPinchHint) return;
    pinchHintOpacity.value = withTiming(1, { duration: 200 });
    pinchHintMorph.value = 0;
    pinchHintMorph.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withDelay(350, withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) })),
        withDelay(500, withTiming(0, { duration: 0 })),
      ),
      -1,
      false,
    );
  }, [showPinchHint, pinchHintOpacity, pinchHintMorph]);

  useEffect(() => {
    if (reservationModalOpen) {
      setReservationModalMounted(true);
      requestAnimationFrame(() => {
        RNAnimated.parallel([
          RNAnimated.timing(modalBackdropOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
          RNAnimated.spring(modalSheetTranslateY, {
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
    RNAnimated.parallel([
      RNAnimated.timing(modalBackdropOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      RNAnimated.timing(modalSheetTranslateY, { toValue: 520, duration: 220, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) setReservationModalMounted(false);
    });
  }, [reservationModalOpen, reservationModalMounted, modalBackdropOpacity, modalSheetTranslateY]);

  const compactImageSize = 104;
  const detailedImageHeight = 190;
  const detailedImageWidth = Math.max(0, windowWidth - Spacing.md * 2 - 2);
  const imageMorphStyle = useAnimatedStyle(
    () => ({
      width: interpolate(morphProgress.value, [0, 1], [compactImageSize, detailedImageWidth]),
      height: interpolate(morphProgress.value, [0, 1], [compactImageSize, detailedImageHeight]),
    }),
    [detailedImageWidth],
  );
  const pinchHintOverlayStyle = useAnimatedStyle(() => ({
    opacity: pinchHintOpacity.value,
  }));
  const pinchSkeletonImageStyle = useAnimatedStyle(() => ({
    left: interpolate(pinchHintMorph.value, [0, 1], [8, 0]),
    top: interpolate(pinchHintMorph.value, [0, 1], [8, 0]),
    width: interpolate(pinchHintMorph.value, [0, 1], [58, Math.max(230, 340 - Spacing.lg * 2)]),
    height: interpolate(pinchHintMorph.value, [0, 1], [58, 110]),
    borderRadius: interpolate(pinchHintMorph.value, [0, 1], [8, 0]),
  }));
  const pinchSkeletonPillsStyle = useAnimatedStyle(() => ({
    top: interpolate(pinchHintMorph.value, [0, 1], [10, 118]),
    left: interpolate(pinchHintMorph.value, [0, 1], [74, 10]),
    right: interpolate(pinchHintMorph.value, [0, 1], [10, 10]),
  }));
  const pinchSkeletonLine1Style = useAnimatedStyle(() => ({
    width: interpolate(pinchHintMorph.value, [0, 1], [98, 160]),
  }));
  const pinchSkeletonLine2Style = useAnimatedStyle(() => ({
    width: interpolate(pinchHintMorph.value, [0, 1], [68, 118]),
  }));
  const pinchSkeletonBadgeStyle = useAnimatedStyle(() => ({
    width: interpolate(pinchHintMorph.value, [0, 1], [88, 132]),
  }));
  const pinchSkeletonExtraPillStyle = useAnimatedStyle(() => ({
    width: interpolate(pinchHintMorph.value, [0, 1], [0, 104]),
    height: interpolate(pinchHintMorph.value, [0, 1], [0, 14]),
    opacity: interpolate(pinchHintMorph.value, [0, 1], [0, 1]),
    marginTop: interpolate(pinchHintMorph.value, [0, 1], [0, 2]),
  }));
  const pinchSkeletonStageStyle = useAnimatedStyle(() => ({
    height: interpolate(pinchHintMorph.value, [0, 1], [78, 200]),
  }));

  const touchDistance = (touches: readonly { pageX: number; pageY: number }[]) => {
    if (touches.length < 2) return null;
    const [a, b] = touches;
    return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
  };

  const onTouchStartList: React.ComponentProps<typeof ScrollView>['onTouchStart'] = (e) => {
    if (e.nativeEvent.touches.length >= 2) {
      isPinchingRef.current = true;
      suppressCardPressUntilRef.current = Date.now() + 280;
    }
    const d = touchDistance(e.nativeEvent.touches);
    if (d == null) return;
    pinchStartDistanceRef.current = d;
    pinchHandledRef.current = false;
  };

  const onTouchMoveList: React.ComponentProps<typeof ScrollView>['onTouchMove'] = (e) => {
    if (e.nativeEvent.touches.length >= 2) {
      isPinchingRef.current = true;
      suppressCardPressUntilRef.current = Date.now() + 280;
    }
    const start = pinchStartDistanceRef.current;
    const d = touchDistance(e.nativeEvent.touches);
    if (start == null || d == null || pinchHandledRef.current) return;
    const scale = d / start;
    if (scale > 1.08) {
      setDetailedCards(true);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      pinchHandledRef.current = true;
    } else if (scale < 0.92) {
      setDetailedCards(false);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      pinchHandledRef.current = true;
    }
  };

  const onTouchEndList: React.ComponentProps<typeof ScrollView>['onTouchEnd'] = (e) => {
    if (e.nativeEvent.touches.length < 2) {
      isPinchingRef.current = false;
      suppressCardPressUntilRef.current = Date.now() + 280;
      pinchStartDistanceRef.current = null;
      pinchHandledRef.current = false;
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerWrap}>
        <View style={styles.top}>
          <View style={styles.searchRow}>
            <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
              <FontAwesome name="chevron-left" size={18} color={colors.text} />
            </Pressable>
            <TextInput
              style={styles.input}
              placeholder="Type of food, restaurant name..."
              placeholderTextColor="#6B7280"
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
          <BookingSummaryPill
            styles={styles}
            primaryColor={colors.primary}
            reservationDate={reservationDate}
            reservationTime={reservationTime}
            reservationGuests={reservationGuests}
            onPress={() => {
              setDraftReservationDate(reservationDate);
              setDraftReservationTime(reservationTime);
              setDraftReservationGuests(reservationGuests);
              setReservationModalOpen(true);
            }}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {FILTERS.map((f) => (
              <Pressable key={f.id} onPress={() => toggleFilter(f.id)} style={[styles.filterChip, activeFilters.includes(f.id) && styles.filterChipActive]}>
                <Text style={[styles.filterChipText, activeFilters.includes(f.id) && styles.filterChipTextActive]}>{f.label}</Text>
                {activeFilters.includes(f.id) ? <Text style={styles.filterX}> ✕</Text> : null}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onTouchStart={onTouchStartList}
        onTouchMove={onTouchMoveList}
        onTouchEnd={onTouchEndList}>
        {results.map((restaurant) => (
          <Animated.View key={restaurant.id} layout={LinearTransition.springify().damping(20).stiffness(320).mass(0.55)}>
            <Pressable
              style={[styles.row, detailedCards && styles.rowDetailed]}
              onPress={() => {
                if (isPinchingRef.current || Date.now() < suppressCardPressUntilRef.current) return;
                router.push({
                  pathname: '/restaurant/[id]',
                  params: {
                    id: restaurant.id,
                    date: reservationDate,
                    time: reservationTime,
                    guests: String(reservationGuests),
                  },
                });
              }}>
              <Animated.View style={[styles.rowImgWrap, detailedCards && styles.rowImgWrapDetailed, imageMorphStyle]}>
                <Image source={{ uri: restaurant.image }} style={styles.rowImg} contentFit="cover" />
              </Animated.View>
              <View style={[styles.rowBody, detailedCards && styles.rowBodyDetailed]}>
                <View style={styles.rowTop}>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {restaurant.name}
                  </Text>
                  <Text style={[styles.rowStatus, { color: restaurant.openNow ? colors.primary : colors.textMuted }]}>
                    {restaurant.openNow ? 'Open' : 'Closed'}
                  </Text>
                </View>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {restaurant.cuisine.join(' · ')} · {restaurant.distanceKm.toFixed(1)} km
                </Text>
                {detailedCards ? (
                  <>
                    <Text style={styles.rowExtra} numberOfLines={2}>
                      ★ {restaurant.rating.toFixed(1)} ({restaurant.reviewCount}) · {restaurant.address} · Closes {restaurant.closingTime}
                    </Text>
                    <Text style={styles.reviewLabel}>Review</Text>
                    <Text style={styles.reviewText} numberOfLines={3}>
                      "{restaurant.reviews[0]?.text ?? 'Great atmosphere and service.'}"
                    </Text>
                  </>
                ) : null}
                {restaurant.fullTonight ? (
                  <View style={styles.fullBadge}>
                    <Text style={styles.fullBadgeText}>Full tonight</Text>
                  </View>
                ) : restaurant.availabilityTonight != null ? (
                  <View
                    style={[
                      styles.softBadge,
                      toneForAvailabilityLeft(restaurant.availabilityTonight) === 'red'
                        ? styles.softBadgeRed
                        : toneForAvailabilityLeft(restaurant.availabilityTonight) === 'orange'
                          ? styles.softBadgeOrange
                          : styles.softBadgeGreen,
                    ]}>
                    <Text
                      style={
                        toneForAvailabilityLeft(restaurant.availabilityTonight) === 'red'
                          ? styles.softBadgeTextRed
                          : toneForAvailabilityLeft(restaurant.availabilityTonight) === 'orange'
                            ? styles.softBadgeTextOrange
                            : styles.softBadgeTextGreen
                      }>
                      {restaurant.availabilityTonight} tables left tonight
                    </Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          </Animated.View>
        ))}
      </ScrollView>
      <Modal visible={reservationModalMounted} transparent animationType="none" onRequestClose={() => setReservationModalOpen(false)}>
        <Pressable style={styles.pickerOverlay} onPress={() => setReservationModalOpen(false)}>
          <RNAnimated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.35)', opacity: modalBackdropOpacity }]} />
          <RNAnimated.View style={{ transform: [{ translateY: modalSheetTranslateY }] }}>
            <Pressable style={[styles.pickerCard, { paddingBottom: insets.bottom + Spacing.lg }]} onPress={() => {}}>
            <Text style={styles.pickerTitle}>Date and Time</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.guestsScroller} contentContainerStyle={styles.guestsScrollerContent}>
              {GUEST_OPTIONS.map((g) => (
                <Pressable key={g} onPress={() => setDraftReservationGuests(g)} style={[styles.pickerChip, draftReservationGuests === g && styles.pickerChipOn]}>
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
                    <Pressable key={date} onPress={() => setDraftReservationDate(date)} style={[styles.pickerChip, draftReservationDate === date && styles.pickerChipOn]}>
                      <Text style={[styles.pickerChipText, draftReservationDate === date && styles.pickerChipTextOn]}>{date}</Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.pickerRow}>
                  {timeOptions.map((time) => (
                    <Pressable key={time} onPress={() => setDraftReservationTime(time)} style={[styles.pickerChip, draftReservationTime === time && styles.pickerChipOn]}>
                      <Text style={[styles.pickerChipText, draftReservationTime === time && styles.pickerChipTextOn]}>{time}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
            <View style={styles.pickerActions}>
              <Pressable style={styles.pickerBtnGhost} onPress={() => setReservationModalOpen(false)}>
                <Text style={styles.pickerBtnGhostText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.pickerBtnPrimary}
                onPress={() => {
                  setReservationDate(draftReservationDate);
                  setReservationTime(draftReservationTime);
                  setReservationGuests(draftReservationGuests);
                  void setReservationPreferences({
                    date: draftReservationDate,
                    time: draftReservationTime,
                    guests: draftReservationGuests,
                  });
                  setReservationModalOpen(false);
                }}>
                <Text style={styles.pickerBtnPrimaryText}>Apply</Text>
              </Pressable>
            </View>
            </Pressable>
          </RNAnimated.View>
        </Pressable>
      </Modal>
      {showPinchHint ? (
        <Animated.View style={[styles.pinchHintOverlay, pinchHintOverlayStyle]} pointerEvents="box-none">
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => {
              pinchHintOpacity.value = withTiming(0, { duration: 160 });
              setTimeout(() => setShowPinchHint(false), 170);
            }}
          />
          <View style={styles.pinchHintCard}>
            <LottieView source={ZOOM_IN_ANIMATION} autoPlay loop style={styles.pinchHintLottie} />
            <Text style={styles.pinchHintTitle}>Pinch to view more info</Text>
            <Text style={styles.pinchHintSub}>Use two fingers to switch card detail level.</Text>
            <Animated.View style={styles.pinchHintSkeletonWrap}>
              <Animated.View style={[styles.pinchHintSkeletonStage, pinchSkeletonStageStyle]}>
                <Animated.View style={[styles.pinchHintSkeletonImage, pinchSkeletonImageStyle]} />
                <Animated.View style={[styles.pinchHintSkeletonPills, pinchSkeletonPillsStyle]}>
                  <Animated.View style={[styles.pinchHintSkeletonLine, pinchSkeletonLine1Style]} />
                  <Animated.View style={[styles.pinchHintSkeletonLine, pinchSkeletonLine2Style]} />
                  <Animated.View style={[styles.pinchHintSkeletonBadge, pinchSkeletonBadgeStyle]} />
                  <Animated.View style={[styles.pinchHintSkeletonBadge, pinchSkeletonExtraPillStyle]} />
                </Animated.View>
              </Animated.View>
            </Animated.View>
          </View>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}
