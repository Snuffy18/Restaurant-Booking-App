import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, interpolate, LinearTransition, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AppColors } from '@/constants/Theme';
import { Radius, Spacing } from '@/constants/Theme';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { RESTAURANTS } from '@/data/mockData';

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
  const [reservationDate, setReservationDate] = useState('Today');
  const [reservationTime, setReservationTime] = useState(timeOptions[0] ?? 'Now');
  const [reservationGuests, setReservationGuests] = useState<(typeof GUEST_OPTIONS)[number]>(2);
  const [draftReservationDate, setDraftReservationDate] = useState('Today');
  const [draftReservationTime, setDraftReservationTime] = useState(timeOptions[0] ?? 'Now');
  const [draftReservationGuests, setDraftReservationGuests] = useState<(typeof GUEST_OPTIONS)[number]>(2);
  const [detailedCards, setDetailedCards] = useState(false);
  const morphProgress = useSharedValue(0);
  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchHandledRef = useRef(false);

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
    morphProgress.value = withTiming(detailedCards ? 1 : 0, {
      duration: 180,
      easing: Easing.out(Easing.cubic),
    });
  }, [detailedCards, morphProgress]);

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

  const touchDistance = (touches: readonly { pageX: number; pageY: number }[]) => {
    if (touches.length < 2) return null;
    const [a, b] = touches;
    return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
  };

  const onTouchStartList: React.ComponentProps<typeof ScrollView>['onTouchStart'] = (e) => {
    const d = touchDistance(e.nativeEvent.touches);
    if (d == null) return;
    pinchStartDistanceRef.current = d;
    pinchHandledRef.current = false;
  };

  const onTouchMoveList: React.ComponentProps<typeof ScrollView>['onTouchMove'] = (e) => {
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
          <Pressable
            style={styles.bookingSummaryPill}
            onPress={() => {
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
              onPress={() => router.push({ pathname: '/restaurant/[id]', params: { id: restaurant.id } })}>
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
      <Modal visible={reservationModalOpen} transparent animationType="slide" onRequestClose={() => setReservationModalOpen(false)}>
        <Pressable style={styles.pickerOverlay} onPress={() => setReservationModalOpen(false)}>
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
                  setReservationModalOpen(false);
                }}>
                <Text style={styles.pickerBtnPrimaryText}>Apply</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
