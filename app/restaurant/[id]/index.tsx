import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { Animated as RNAnimated, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import FontAwesome from '@expo/vector-icons/FontAwesome';

import type { AppColors } from '@/constants/Theme';
import { FontFamily, Radius, Spacing } from '@/constants/Theme';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { getRestaurant, type Restaurant } from '@/data/mockData';
import { pushLastVisitedRestaurantId } from '@/lib/lastVisitedRestaurant';
import { getReservationPreferences, setReservationPreferences } from '@/lib/reservationPreferences';

type ReviewItem = Restaurant['reviews'][number];

type SectionKey = 'overview' | 'menu' | 'reviews' | 'info';

const SECTION_ORDER: SectionKey[] = ['overview', 'menu', 'reviews', 'info'];
const GUEST_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

/** Padding under sticky shortcut bar when aligning section titles */
const SECTION_LEAD = 8;

/** Scroll distance (px) over which safe-area top padding ramps in before the bar sticks */
const STICKY_TOP_BLEND = 36;

function buildDateOptions(): string[] {
  return Array.from({ length: 31 }, (_, offset) => {
    if (offset === 0) return 'Today';
    if (offset === 1) return 'Tomorrow';
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' }).replace(',', '');
  });
}

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

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    miss: { flex: 1, backgroundColor: c.background, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
    missText: { color: c.textSecondary, marginBottom: Spacing.md },
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
      backgroundColor: c.overlay,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pad: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
    tabBody: { paddingHorizontal: Spacing.md },
    sectionBlock: { paddingTop: Spacing.sm },
    titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
    name: { flex: 1, fontSize: 26, fontWeight: '900', color: c.text },
    openBadge: { backgroundColor: c.primaryMuted, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
    closedBadge: { backgroundColor: c.chipMuted },
    openText: { color: c.primary, fontWeight: '800', fontSize: 12 },
    closedText: { color: c.textMuted },
    rating: { marginTop: 6, color: c.textSecondary, fontWeight: '600' },
    pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: Spacing.md },
    pill: { backgroundColor: c.card, borderWidth: 1, borderColor: c.border, paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.full },
    pillMuted: { backgroundColor: c.inputBg },
    pillText: { fontWeight: '700', color: c.text, fontSize: 12 },
    pillTextMuted: { fontWeight: '700', color: c.textSecondary, fontSize: 12 },
    infoRow: { marginTop: Spacing.md },
    infoText: { color: c.textSecondary, lineHeight: 20 },
    stickyShortcutBar: {
      backgroundColor: c.background,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
      zIndex: 2,
    },
    navBarInner: { paddingHorizontal: Spacing.md, paddingTop: Spacing.xs, paddingBottom: Spacing.sm },
    navRow: { position: 'relative' },
    navTabsRow: { flexDirection: 'row', width: '100%' },
    navTabHit: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm },
    navLabel: { fontFamily: FontFamily.nunitoSans, fontSize: 15, color: c.textSecondary },
    navLabelActive: { fontFamily: FontFamily.nunitoSans, fontSize: 15, color: c.primary },
    navUnderline: {
      position: 'absolute',
      left: 0,
      bottom: 0,
      height: 2,
      borderRadius: 1,
      backgroundColor: c.primary,
    },
    section: { paddingBottom: Spacing.lg },
    sectionDividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginTop: Spacing.lg,
      marginBottom: Spacing.md,
    },
    sectionDividerRowFirst: { marginTop: 0 },
    sectionDividerLabel: { fontWeight: '900', color: c.text, fontSize: 20 },
    sectionDividerLine: { flex: 1, height: 1, backgroundColor: c.border },
    about: { color: c.textSecondary, lineHeight: 24, fontSize: 15 },
    vibeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: Spacing.md,
    },
    vibeCard: {
      width: '48%',
      backgroundColor: c.card,
      borderRadius: Radius.md,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: c.border,
    },
    vibeCardDescription: {
      color: c.text,
      fontSize: 15,
      fontWeight: '800',
      textAlign: 'center',
      lineHeight: 20,
    },
    reviewCard: {
      backgroundColor: c.card,
      borderRadius: Radius.md,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: Spacing.md,
    },
    reviewCardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
    reviewCardAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
    reviewAvatar: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.text,
    },
    reviewAvatarText: { color: '#fff', fontWeight: '800', fontSize: 13 },
    reviewAuthor: { fontWeight: '800', color: c.text, fontSize: 14 },
    reviewRating: {
      fontWeight: '800',
      fontSize: 13,
      color: c.primary,
    },
    reviewMessage: { color: c.textSecondary, lineHeight: 22, fontSize: 14, fontStyle: 'italic' },
    seeMoreReviews: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.md,
      marginTop: Spacing.xs,
    },
    seeMoreReviewsText: { fontSize: 15, fontWeight: '700', color: c.primary },
    menuCat: { fontWeight: '900', fontSize: 16, marginBottom: Spacing.sm, color: c.text },
    menuRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md, marginBottom: Spacing.sm },
    menuItem: { flex: 1, color: c.text, fontWeight: '600' },
    menuPrice: { color: c.textSecondary, fontWeight: '700' },
    breakdownWrap: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.lg,
      marginBottom: Spacing.md,
    },
    breakdownScoreBlock: { flexShrink: 0, maxWidth: 120 },
    breakdownBigScore: {
      fontFamily: FontFamily.bebasNeue,
      fontSize: 56,
      letterSpacing: 1,
      color: c.text,
      lineHeight: 58,
    },
    breakdownOutOf: { fontSize: 12, fontWeight: '700', color: c.textMuted, marginTop: 2 },
    breakdownReviewCount: { marginTop: Spacing.sm, fontSize: 13, fontWeight: '700', color: c.textSecondary },
    breakdown: { flex: 1, minWidth: 0 },
    breakRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 6 },
    breakLabel: { width: 28, color: c.textMuted, fontSize: 12 },
    breakBar: { flex: 1, height: 8, backgroundColor: c.border, borderRadius: 4, overflow: 'hidden' },
    breakFill: { height: '100%', backgroundColor: c.primary },
    infoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      backgroundColor: c.card,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: c.border,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
    },
    infoIconWrap: {
      width: 44,
      height: 44,
      borderRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.inputBg,
    },
    infoMetaLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: c.textMuted,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      marginBottom: 2,
    },
    infoMetaValue: { color: c.text, fontSize: 15, fontWeight: '600' },
    facilitiesCard: {
      backgroundColor: c.card,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: c.border,
      padding: Spacing.md,
      marginTop: Spacing.sm,
    },
    facilitiesTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: c.textMuted,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      marginBottom: Spacing.md,
    },
    facilityRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
    facilityCheck: {
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.primary,
    },
    facilityText: { color: c.text, fontSize: 15, flex: 1 },
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
    stickyInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
    stickyLabel: { fontWeight: '900', color: c.text },
    stickySub: { color: c.textSecondary, marginTop: 2, fontSize: 12 },
    stickySubPressable: { alignSelf: 'flex-start', marginTop: 2 },
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
    pickerTitle: { color: c.text, fontWeight: '900', fontSize: 18 },
    pickerLabel: { color: c.textMuted, fontWeight: '700', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
    pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
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
    reserveBtn: {
      backgroundColor: c.primary,
      paddingHorizontal: Spacing.lg,
      paddingVertical: 14,
      borderRadius: Radius.md,
    },
    reserveBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
    primaryBtn: {
      backgroundColor: c.primary,
      paddingHorizontal: Spacing.lg,
      paddingVertical: 12,
      borderRadius: Radius.md,
    },
    primaryLabel: { color: '#fff', fontWeight: '800' },
  });
}

type RestaurantStyles = ReturnType<typeof createStyles>;

function SectionDivider({
  label,
  styles,
  first = false,
}: {
  label: string;
  styles: RestaurantStyles;
  first?: boolean;
}) {
  return (
    <View style={[styles.sectionDividerRow, first && styles.sectionDividerRowFirst]}>
      <Text style={styles.sectionDividerLabel}>{label}</Text>
      <View style={styles.sectionDividerLine} />
    </View>
  );
}

function ReviewCard({ review, styles }: { review: ReviewItem; styles: RestaurantStyles }) {
  const rounded = Math.max(1, Math.min(5, Math.round(review.rating)));
  const stars = `${'★'.repeat(rounded)}${'☆'.repeat(5 - rounded)}`;
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewCardHead}>
        <View style={styles.reviewCardAuthorRow}>
          <View style={styles.reviewAvatar}>
            <Text style={styles.reviewAvatarText}>{review.author.charAt(0)}</Text>
          </View>
          <Text style={styles.reviewAuthor}>{review.author}</Text>
        </View>
        <Text style={styles.reviewRating}>{stars}</Text>
      </View>
      <Text style={styles.reviewMessage}>"{review.text}"</Text>
    </View>
  );
}

export default function RestaurantScreen() {
  const { colors, resolvedScheme } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { id, date: routeDate, time: routeTime, guests: routeGuests } = useLocalSearchParams<{
    id: string;
    date?: string;
    time?: string;
    guests?: string;
  }>();
  const restaurant = useMemo(() => (id ? getRestaurant(String(id)) : undefined), [id]);
  const dateOptions = useMemo(() => buildDateOptions(), []);
  const timeOptions = useMemo(() => buildTimeOptions(), []);
  const [activeSection, setActiveSection] = useState<SectionKey>('overview');
  const [favourite, setFavourite] = useState(false);
  const [reviewsExpanded, setReviewsExpanded] = useState(false);
  const [bookingDate, setBookingDate] = useState('Today');
  const [bookingTime, setBookingTime] = useState(timeOptions[0] ?? 'Now');
  const [bookingGuests, setBookingGuests] = useState<(typeof GUEST_OPTIONS)[number]>(2);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMounted, setPickerMounted] = useState(false);
  const [draftDate, setDraftDate] = useState('Today');
  const [draftTime, setDraftTime] = useState(timeOptions[0] ?? 'Now');
  const [draftGuests, setDraftGuests] = useState<(typeof GUEST_OPTIONS)[number]>(2);
  const pickerBackdropOpacity = useRef(new RNAnimated.Value(0)).current;
  const pickerSheetTranslateY = useRef(new RNAnimated.Value(520)).current;
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<Animated.ScrollView>(null);
  /** Y of each section top, relative to the main content block (below hero + shortcuts). */
  const sectionY = useRef<Partial<Record<SectionKey, number>>>({});
  const blockHeights = useRef({ a: 0 });
  const activeSectionRef = useRef<SectionKey>('overview');
  const scrollY = useSharedValue(0);
  const blockA = useSharedValue(0);
  const maxStickyTopPad = useSharedValue(insets.top + Spacing.sm);

  useEffect(() => {
    maxStickyTopPad.value = insets.top + Spacing.sm;
  }, [insets.top]);

  useEffect(() => {
    if (!id) return;
    void pushLastVisitedRestaurantId(String(id));
  }, [id]);

  const recordBlockA = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    blockHeights.current.a = h;
    blockA.value = h;
  }, []);

  const recordSectionLayout = useCallback((key: SectionKey) => {
    return (e: LayoutChangeEvent) => {
      sectionY.current[key] = e.nativeEvent.layout.y;
    };
  }, []);

  const scrollToSection = useCallback((key: SectionKey) => {
    const rel = sectionY.current[key];
    const a = blockHeights.current.a;
    if (rel != null) {
      scrollRef.current?.scrollTo({
        y: Math.max(0, a + rel - SECTION_LEAD),
        animated: true,
      });
    }
    setActiveSection(key);
    activeSectionRef.current = key;
  }, []);

  const pickSectionForScrollY = useCallback((y: number): SectionKey => {
    const a = blockHeights.current.a;
    if (a <= 0) return 'overview';
    const threshold = y + SECTION_LEAD - a;
    const entries = SECTION_ORDER.map((k) => [k, sectionY.current[k] ?? -1] as const).filter(([, ry]) => ry >= 0);
    entries.sort((u, v) => u[1] - v[1]);
    let picked: SectionKey = 'overview';
    for (const [k, relY] of entries) {
      if (relY <= threshold) picked = k;
    }
    return picked;
  }, []);

  const updateActiveSectionFromScroll = useCallback(
    (y: number) => {
      const next = pickSectionForScrollY(y);
      if (next !== activeSectionRef.current) {
        activeSectionRef.current = next;
        setActiveSection(next);
      }
    },
    [pickSectionForScrollY],
  );

  const onScrollReanimated = useAnimatedScrollHandler(
    {
      onScroll: (e) => {
        scrollY.value = e.contentOffset.y;
        runOnJS(updateActiveSectionFromScroll)(e.contentOffset.y);
      },
    },
    [updateActiveSectionFromScroll],
  );

  const shortcutTopSpacerStyle = useAnimatedStyle(() => {
    const a = blockA.value;
    const max = maxStickyTopPad.value;
    if (a <= 0) return { height: 0 };
    const y = scrollY.value;
    const h = interpolate(y, [Math.max(0, a - STICKY_TOP_BLEND), a], [0, max], Extrapolation.CLAMP);
    return { height: h };
  });

  const tabLayouts = useRef<{ x: number; width: number }[]>([]);
  const indicatorX = useSharedValue(0);
  const indicatorW = useSharedValue(0);

  const syncNavUnderline = useCallback(() => {
    const idx = SECTION_ORDER.indexOf(activeSectionRef.current);
    const L = tabLayouts.current[idx];
    if (!L || L.width <= 0) return;
    const timing = { duration: 240, easing: Easing.out(Easing.cubic) };
    indicatorX.value = withTiming(L.x, timing);
    indicatorW.value = withTiming(L.width, timing);
  }, [indicatorX, indicatorW]);

  const onNavTabLayout = useCallback(
    (index: number, e: LayoutChangeEvent) => {
      const { x, width } = e.nativeEvent.layout;
      tabLayouts.current[index] = { x, width };
      syncNavUnderline();
    },
    [syncNavUnderline],
  );

  const navUnderlineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorW.value,
  }));

  useEffect(() => {
    syncNavUnderline();
  }, [activeSection, syncNavUnderline]);

  useEffect(() => {
    sectionY.current = {};
    blockHeights.current = { a: 0 };
    tabLayouts.current = [];
    activeSectionRef.current = 'overview';
    scrollY.value = 0;
    blockA.value = 0;
    indicatorX.value = 0;
    indicatorW.value = 0;
    setActiveSection('overview');
    setReviewsExpanded(false);
    let active = true;
    void (async () => {
      const saved = await getReservationPreferences();
      if (!active) return;
      const defaultTime = timeOptions[0] ?? 'Now';
      const nextDate = routeDate ? String(routeDate) : saved?.date ?? 'Today';
      const requestedTime = routeTime ? String(routeTime) : saved?.time ?? defaultTime;
      const nextTime = timeOptions.includes(requestedTime) ? requestedTime : defaultTime;
      const routeGuestsParsed = routeGuests != null ? Number(routeGuests) : NaN;
      const requestedGuests = Number.isFinite(routeGuestsParsed) ? routeGuestsParsed : (saved?.guests ?? 2);
      const nextGuests = GUEST_OPTIONS.includes(requestedGuests as (typeof GUEST_OPTIONS)[number])
        ? (requestedGuests as (typeof GUEST_OPTIONS)[number])
        : 2;

      setBookingDate(nextDate);
      setBookingTime(nextTime);
      setBookingGuests(nextGuests);
      setDraftDate(nextDate);
      setDraftTime(nextTime);
      setDraftGuests(nextGuests);
      void setReservationPreferences({
        date: nextDate,
        time: nextTime,
        guests: nextGuests,
      });
    })();
    setPickerOpen(false);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    return () => {
      active = false;
    };
  }, [id, routeDate, routeGuests, routeTime, timeOptions]);

  useEffect(() => {
    if (pickerOpen) {
      setPickerMounted(true);
      requestAnimationFrame(() => {
        RNAnimated.parallel([
          RNAnimated.timing(pickerBackdropOpacity, { toValue: 0.35, duration: 180, useNativeDriver: true }),
          RNAnimated.spring(pickerSheetTranslateY, {
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
    if (!pickerMounted) return;
    RNAnimated.parallel([
      RNAnimated.timing(pickerBackdropOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      RNAnimated.timing(pickerSheetTranslateY, { toValue: 520, duration: 230, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) setPickerMounted(false);
    });
  }, [pickerBackdropOpacity, pickerMounted, pickerOpen, pickerSheetTranslateY]);

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

  const bottomPad = 120 + insets.bottom;
  const openBookingPicker = () => {
    setDraftDate(bookingDate);
    setDraftTime(bookingTime);
    setDraftGuests(bookingGuests);
    setPickerOpen(true);
  };

  return (
    <View style={styles.root}>
      <Animated.ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        stickyHeaderIndices={[1]}
        onScroll={onScrollReanimated}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: bottomPad }}>
        <View collapsable={false} onLayout={recordBlockA}>
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
              {restaurant.rating} <Text style={{ color: '#FACC15' }}>★</Text> · {restaurant.reviewCount} reviews
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
                <View key={v} style={styles.pill}>
                  <Text style={styles.pillText}>{v}</Text>
                </View>
              ))}
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoText} numberOfLines={1}>
                📍 {restaurant.address} · {restaurant.distanceKm.toFixed(1)} km · Closes {restaurant.closingTime}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.stickyShortcutBar} collapsable={false}>
          <Animated.View style={[{ backgroundColor: colors.background }, shortcutTopSpacerStyle]} />
          <View style={styles.navBarInner}>
            <View style={styles.navRow}>
              <View style={styles.navTabsRow}>
                {(
                  [
                    ['overview', 'Overview'],
                    ['menu', 'Menu'],
                    ['reviews', 'Reviews'],
                    ['info', 'Info'],
                  ] as const
                ).map(([k, label], index) => (
                  <Pressable
                    key={k}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: activeSection === k }}
                    onPress={() => scrollToSection(k)}
                    style={styles.navTabHit}
                    onLayout={(e) => onNavTabLayout(index, e)}>
                    <Text style={[styles.navLabel, activeSection === k && styles.navLabelActive]}>{label}</Text>
                  </Pressable>
                ))}
              </View>
              <Animated.View style={[styles.navUnderline, navUnderlineStyle]} />
            </View>
          </View>
        </View>

        <View collapsable={false}>
          <View
            collapsable={false}
            style={[styles.tabBody, styles.sectionBlock, styles.section]}
            onLayout={recordSectionLayout('overview')}>
            <SectionDivider label="About" styles={styles} first />
            <Text style={styles.about}>{restaurant.about}</Text>

            <SectionDivider label="The Experience" styles={styles} />
            <View style={styles.vibeGrid}>
              {restaurant.vibeDescriptions.map((desc, i) => (
                <View key={i} style={styles.vibeCard}>
                  <Text style={styles.vibeCardDescription}>{desc}</Text>
                </View>
              ))}
            </View>
          </View>

          <View
            collapsable={false}
            style={[styles.tabBody, styles.sectionBlock, styles.section]}
            onLayout={recordSectionLayout('menu')}>
            <SectionDivider label="Menu" styles={styles} first />
            {restaurant.menu.map((cat) => (
              <View key={cat.category} style={{ marginBottom: Spacing.lg }}>
                <Text style={styles.menuCat}>{cat.category}</Text>
                {cat.items.map((it) => (
                  <View key={`${cat.category}-${it.name}`} style={styles.menuRow}>
                    <Text style={styles.menuItem}>{it.name}</Text>
                    <Text style={styles.menuPrice}>{it.price}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>

          <View
            collapsable={false}
            style={[styles.tabBody, styles.sectionBlock, styles.section]}
            onLayout={recordSectionLayout('reviews')}>
            <SectionDivider label="Reviews" styles={styles} first />
            <View style={styles.breakdownWrap}>
              <View style={styles.breakdownScoreBlock}>
                <Text style={styles.breakdownBigScore}>{restaurant.rating.toFixed(1)}</Text>
                <Text style={styles.breakdownOutOf}>out of 5</Text>
                <Text style={styles.breakdownReviewCount}>
                  {restaurant.reviewCount.toLocaleString()} reviews
                </Text>
              </View>
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
            </View>
            {reviewsExpanded ? (
              restaurant.reviews.map((r) => <ReviewCard key={r.id} review={r} styles={styles} />)
            ) : (
              <>
                {restaurant.reviews[0] ? (
                  <ReviewCard key={restaurant.reviews[0].id} review={restaurant.reviews[0]} styles={styles} />
                ) : null}
                {restaurant.reviews[1] ? (
                  <ReviewCard key={restaurant.reviews[1].id} review={restaurant.reviews[1]} styles={styles} />
                ) : null}
                {restaurant.reviews.length > 2 ? (
                  <Pressable
                    onPress={() => setReviewsExpanded(true)}
                    style={styles.seeMoreReviews}
                    accessibilityRole="button"
                    accessibilityLabel="See more reviews">
                    <Text style={styles.seeMoreReviewsText}>See more reviews</Text>
                    <FontAwesome name="chevron-down" size={14} color={colors.primary} />
                  </Pressable>
                ) : null}
              </>
            )}
          </View>

          <View
            collapsable={false}
            style={[styles.tabBody, styles.sectionBlock, styles.section]}
            onLayout={recordSectionLayout('info')}>
            <SectionDivider label="Info" styles={styles} first />
            <View style={styles.infoCard}>
              <View style={styles.infoIconWrap}>
                <FontAwesome name="clock-o" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoMetaLabel}>Hours</Text>
                {restaurant.hours.map((h) => (
                  <Text key={h.day} style={styles.infoMetaValue}>
                    {h.day} · {h.hours}
                  </Text>
                ))}
              </View>
            </View>
            <View style={styles.infoCard}>
              <View style={styles.infoIconWrap}>
                <FontAwesome name="map-marker" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoMetaLabel}>Address</Text>
                <Text style={styles.infoMetaValue}>{restaurant.address}</Text>
              </View>
            </View>
            <View style={styles.infoCard}>
              <View style={styles.infoIconWrap}>
                <FontAwesome name="phone" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoMetaLabel}>Contact</Text>
                <Text style={styles.infoMetaValue}>{restaurant.phone}</Text>
              </View>
            </View>
            <View style={styles.facilitiesCard}>
              <Text style={styles.facilitiesTitle}>Facilities</Text>
              {restaurant.facilities.map((f) => (
                <View key={f} style={styles.facilityRow}>
                  <View style={styles.facilityCheck}>
                    <FontAwesome name="check" size={11} color="#fff" />
                  </View>
                  <Text style={styles.facilityText}>{f}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </Animated.ScrollView>

      <View style={[styles.sticky, { paddingBottom: insets.bottom + Spacing.sm }]}>
        <View style={styles.stickyInner}>
          <View>
            <Pressable onPress={openBookingPicker} accessibilityRole="button" accessibilityLabel="Change booking date and time">
              <Text style={styles.stickyLabel}>{bookingDate} · {bookingTime}</Text>
            </Pressable>
            <Pressable
              onPress={openBookingPicker}
              style={styles.stickySubPressable}
              accessibilityRole="button"
              accessibilityLabel="Change booking time and guests">
              <Text style={styles.stickySub}>{bookingGuests} guests · Tap to change</Text>
            </Pressable>
          </View>
          <Pressable
            style={styles.reserveBtn}
            onPress={() =>
              router.push({
                pathname: '/restaurant/[id]/seats',
                params: { id: String(id), date: bookingDate, time: bookingTime, guests: String(bookingGuests) },
              })
            }>
            <Text style={styles.reserveBtnText}>Reserve</Text>
          </Pressable>
        </View>
      </View>

      <Modal visible={pickerMounted} transparent animationType="none" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.pickerOverlay} onPress={() => setPickerOpen(false)}>
          <RNAnimated.View pointerEvents="none" style={[styles.pickerBackdrop, { opacity: pickerBackdropOpacity }]} />
          <RNAnimated.View style={{ transform: [{ translateY: pickerSheetTranslateY }] }}>
            <Pressable style={[styles.pickerCard, { paddingBottom: insets.bottom + Spacing.md }]} onPress={() => {}}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.guestsScroller} contentContainerStyle={styles.guestsScrollerContent}>
              {GUEST_OPTIONS.map((g) => (
                <Pressable
                  key={g}
                  onPress={() => setDraftGuests(g)}
                  style={[styles.pickerChip, draftGuests === g && styles.pickerChipOn]}>
                  <Text style={[styles.pickerChipText, draftGuests === g && styles.pickerChipTextOn]}>{g} guests</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={styles.pickerTitle}>Date and Time</Text>
            {Platform.OS === 'ios' ? (
              <View style={styles.pickerTwoColRow}>
                <View style={styles.pickerCol}>
                  <View style={styles.pickerWheelBlock}>
                    <Picker
                      selectedValue={draftDate}
                      onValueChange={(v) => setDraftDate(String(v))}
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
                      selectedValue={draftTime}
                      onValueChange={(v) => setDraftTime(String(v))}
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
                <View>
                  <View style={styles.pickerRow}>
                    {dateOptions.map((date) => (
                      <Pressable
                        key={date}
                        onPress={() => setDraftDate(date)}
                        style={[styles.pickerChip, draftDate === date && styles.pickerChipOn]}>
                        <Text style={[styles.pickerChipText, draftDate === date && styles.pickerChipTextOn]}>{date}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <View>
                  <View style={styles.pickerRow}>
                    {timeOptions.map((time) => (
                      <Pressable
                        key={time}
                        onPress={() => setDraftTime(time)}
                        style={[styles.pickerChip, draftTime === time && styles.pickerChipOn]}>
                        <Text style={[styles.pickerChipText, draftTime === time && styles.pickerChipTextOn]}>{time}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </>
            )}
            <View style={styles.pickerActions}>
              <Pressable style={styles.pickerBtnGhost} onPress={() => setPickerOpen(false)}>
                <Text style={styles.pickerBtnGhostText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.pickerBtnPrimary}
                onPress={() => {
                  setBookingDate(draftDate);
                  setBookingTime(draftTime);
                  setBookingGuests(draftGuests);
                  void setReservationPreferences({
                    date: draftDate,
                    time: draftTime,
                    guests: draftGuests,
                  });
                  setPickerOpen(false);
                }}>
                <Text style={styles.pickerBtnPrimaryText}>Apply</Text>
              </Pressable>
            </View>
            </Pressable>
          </RNAnimated.View>
        </Pressable>
      </Modal>
    </View>
  );
}
