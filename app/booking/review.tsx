import { router, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Animated, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMemo, useRef, useState } from 'react';

import { BookingSuccessCard } from '@/components/BookingSuccessCard';
import type { AppColors } from '@/constants/Theme';
import { Radius, Spacing } from '@/constants/Theme';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { Booking, getRestaurant } from '@/data/mockData';
import { upsertUserBooking } from '@/lib/bookingsStore';

function createStyles(c: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    body: { padding: Spacing.md, paddingBottom: Spacing.xl },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 6 },
    title: { color: c.text, fontSize: 24, fontWeight: '900', marginBottom: 6 },
    subtitle: { color: c.textSecondary, lineHeight: 20, marginBottom: Spacing.lg },
    ticketShell: {
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: Radius.lg,
      overflow: 'visible',
    },
    ticketMainContent: {
      zIndex: 1,
    },
    card: {
      backgroundColor: 'transparent',
      borderWidth: 0,
      borderRadius: 0,
      overflow: 'hidden',
    },
    hero: {
      width: '100%',
      height: 190,
    },
    cardInner: {
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    restaurantTitle: {
      color: c.text,
      fontWeight: '900',
      fontSize: 20,
      marginBottom: 2,
    },
    restaurantAddress: {
      color: c.textSecondary,
      lineHeight: 18,
      marginBottom: Spacing.sm,
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md, alignItems: 'center' },
    rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
    label: { color: c.textMuted, fontWeight: '700' },
    value: { color: c.text, fontWeight: '800', flexShrink: 1, textAlign: 'right' },
    actions: { marginTop: 0, width: '100%', alignSelf: 'stretch' },
    swipeWrap: {
      width: '100%',
      backgroundColor: c.primaryMuted,
      overflow: 'hidden',
      height: 48,
      justifyContent: 'center',
      alignSelf: 'center',
      zIndex: 2,
    },
    swipeFill: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      backgroundColor: c.background,
    },
    swipeHintText: { color: c.textSecondary, fontWeight: '800', textAlign: 'center' },
    swipeHintTextDone: { color: '#fff' },
    swipeHintOverlay: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
    },
    swipeHintOverlayTextWrap: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
    },
    swipeHintTextPassed: {
      color: c.background,
      fontWeight: '800',
      textAlign: 'center',
    },
    swipeNotchCutLeft: {
      position: 'absolute',
      left: -12,
      top: 12,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: c.background,
      zIndex: 3,
    },
    swipeNotchCutRight: {
      position: 'absolute',
      right: -12,
      top: 12,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: c.background,
      zIndex: 3,
    },
    swipeThumb: {
      position: 'absolute',
      top: 2,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 3,
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
    },
    ticketCutWrap: {
      marginTop: 0,
      marginBottom: 0,
      position: 'relative',
      height: 58,
      justifyContent: 'center',
      alignItems: 'stretch',
      backgroundColor: c.card,
    },
    ticketCutLine: {
      position: 'absolute',
      left: 14,
      right: 14,
      top: '50%',
      borderTopWidth: 2,
      borderStyle: 'dashed',
      borderTopColor: c.border,
    },
    ticketCutHoleLeft: {
      position: 'absolute',
      left: -12,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: c.background,
      top: '50%',
      marginTop: -12,
    },
    ticketCutHoleRight: {
      position: 'absolute',
      right: -12,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: c.background,
      top: '50%',
      marginTop: -12,
    },
    confirmPreviewWrap: {
      margin: Spacing.md,
      marginTop: Spacing.sm,
      zIndex: 5,
    },
    confirmPreviewWrapExpanded: {
      marginHorizontal: 2,
    },
  });
}

export default function BookingReviewScreen() {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const { restaurantId, tableName, date, time, guests } = useLocalSearchParams<{
    restaurantId?: string;
    tableName?: string;
    date?: string;
    time?: string;
    guests?: string;
  }>();

  const resolvedRestaurantId = String(restaurantId ?? '');
  const restaurant = resolvedRestaurantId ? getRestaurant(resolvedRestaurantId) : undefined;
  const resolvedDate = String(date ?? 'Today');
  const resolvedTime = String(time ?? '19:30');
  const resolvedGuests = Number(guests ?? '2');
  const resolvedTable = String(tableName ?? 'Table');
  const [swipeWidth, setSwipeWidth] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketShellY, setTicketShellY] = useState(0);
  const [confirmCardY, setConfirmCardY] = useState(0);
  const contentTranslateY = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const confirmTranslateY = useRef(new Animated.Value(0)).current;
  const confirmOpacity = useRef(new Animated.Value(1)).current;
  const confirmScale = useRef(new Animated.Value(1)).current;
  const thumbSize = 48;
  const maxTranslate = Math.max(0, swipeWidth - thumbSize - 8);
  const dragX = useRef(new Animated.Value(0)).current;
  const lastHapticBucket = useRef(0);

  const finalizeReservation = async () => {
    const generatedRef = `#TRM-${Math.floor(10000 + Math.random() * 90000)}`;
    const createdBooking: Booking = {
      id: `ub-${Date.now()}`,
      ref: generatedRef,
      restaurantId: resolvedRestaurantId,
      restaurantName: restaurant?.name ?? 'Restaurant',
      image: restaurant?.image ?? '',
      address: restaurant?.address ?? '',
      date: resolvedDate,
      time: resolvedTime,
      guests: resolvedGuests,
      tableName: resolvedTable,
      status: 'upcoming',
      reminderText: 'Reminder set · 2 hours before · Free cancel until 48h prior to your booking',
    };
    await upsertUserBooking(createdBooking);
    router.push({
      pathname: '/booking/confirm',
      params: {
        restaurantId: resolvedRestaurantId,
        tableName: resolvedTable,
        ref: generatedRef,
        date: resolvedDate,
        time: resolvedTime,
        guests: String(resolvedGuests),
        fromReview: '1',
      },
    });
  };

  const startConfirmTransition = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const topTargetInsideTicket = ticketShellY -210;
    const morphShift = confirmCardY > 0 ? topTargetInsideTicket - confirmCardY : -120;

    Animated.parallel([
      Animated.timing(contentTranslateY, {
        toValue: -56,
        duration: 520,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 920,
        useNativeDriver: true,
      }),
      Animated.timing(confirmTranslateY, {
        toValue: morphShift,
        duration: 680,
        useNativeDriver: true,
      }),
      Animated.timing(confirmOpacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(confirmScale, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
    ]).start(() => {
      void finalizeReservation();
    });
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: () => !isSubmitting,
        onPanResponderGrant: () => {
          setIsSwiping(true);
          lastHapticBucket.current = 0;
        },
        onPanResponderMove: (_, gesture) => {
          const next = Math.max(0, Math.min(maxTranslate, gesture.dx));
          dragX.setValue(next);

          const nextBucket = Math.floor(next / 2);
          if (nextBucket > lastHapticBucket.current) {
            lastHapticBucket.current = nextBucket;
            void Haptics.selectionAsync();
          }
        },
        onPanResponderRelease: (_, gesture) => {
          setIsSwiping(false);
          const next = Math.max(0, Math.min(maxTranslate, gesture.dx));
          const reachedEnd = maxTranslate > 0 && next >= maxTranslate * 0.88;
          if (reachedEnd) {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            Animated.timing(dragX, {
              toValue: maxTranslate,
              duration: 120,
              useNativeDriver: false,
            }).start(() => {
              startConfirmTransition();
            });
          } else {
            lastHapticBucket.current = 0;
            Animated.spring(dragX, {
              toValue: 0,
              useNativeDriver: false,
              bounciness: 0,
            }).start();
          }
        },
        onPanResponderTerminate: () => {
          setIsSwiping(false);
          lastHapticBucket.current = 0;
          Animated.spring(dragX, {
            toValue: 0,
            useNativeDriver: false,
            bounciness: 0,
          }).start();
        },
      }),
    [
      confirmCardY,
      confirmOpacity,
      confirmScale,
      confirmTranslateY,
      contentOpacity,
      contentTranslateY,
      dragX,
      isSubmitting,
      maxTranslate,
      ticketShellY,
    ],
  );

  const fillWidth = dragX.interpolate({
    inputRange: [0, maxTranslate || 1],
    outputRange: [0, Math.max(0, swipeWidth)],
    extrapolate: 'clamp',
  });
  const passedTextWidth = Animated.add(dragX, thumbSize);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} scrollEnabled={!isSwiping}>
        <View>
          <Animated.View style={{ opacity: contentOpacity, transform: [{ translateY: contentTranslateY }] }}>
          <Pressable style={styles.titleRow} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
            <FontAwesome name="chevron-left" size={18} color={colors.text} />
            <Text style={styles.title}>Check your booking</Text>
          </Pressable>
          <Text style={styles.subtitle}>Make sure everything looks right before confirming your reservation.</Text>
          </Animated.View>

          <View
            style={styles.ticketShell}
            onLayout={(e) => {
              setTicketShellY(e.nativeEvent.layout.y);
            }}>
            <Animated.View style={[styles.ticketMainContent, { opacity: contentOpacity, transform: [{ translateY: contentTranslateY }] }]}>
              <View style={styles.card}>
                {restaurant?.image ? <Image source={{ uri: restaurant.image }} style={styles.hero} contentFit="cover" /> : null}
                <View style={styles.cardInner}>
                  <Text style={styles.restaurantTitle}>{restaurant?.name ?? 'Restaurant'}</Text>
                  <Text style={styles.restaurantAddress}>{restaurant?.address ?? 'Address unavailable'}</Text>

                  <View style={styles.row}>
                    <View style={styles.rowLeft}>
                      <MaterialIcons name="event" size={18} color={colors.primary} />
                      <Text style={styles.label}>Date</Text>
                    </View>
                    <Text style={styles.value}>{resolvedDate}</Text>
                  </View>
                  <View style={styles.row}>
                    <View style={styles.rowLeft}>
                      <MaterialIcons name="schedule" size={18} color={colors.primary} />
                      <Text style={styles.label}>Time</Text>
                    </View>
                    <Text style={styles.value}>{resolvedTime}</Text>
                  </View>
                  <View style={styles.row}>
                    <View style={styles.rowLeft}>
                      <MaterialIcons name="groups" size={18} color={colors.primary} />
                      <Text style={styles.label}>Guests</Text>
                    </View>
                    <Text style={styles.value}>{resolvedGuests}</Text>
                  </View>
                  <View style={styles.row}>
                    <View style={styles.rowLeft}>
                      <MaterialIcons name="table-restaurant" size={18} color={colors.primary} />
                      <Text style={styles.label}>Table</Text>
                    </View>
                    <Text style={styles.value}>{resolvedTable}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.ticketCutWrap}>
                <View style={styles.ticketCutHoleLeft} />
                <View style={styles.ticketCutLine} />
                <View style={styles.ticketCutHoleRight} />
                <View style={styles.actions}>
                  <View
                    style={styles.swipeWrap}
                    onLayout={(e) => {
                      setSwipeWidth(e.nativeEvent.layout.width);
                    }}>
                    <Animated.View style={[styles.swipeFill, { left: 0, width: fillWidth }]} />
                    <View pointerEvents="none" style={styles.swipeNotchCutLeft} />
                    <View pointerEvents="none" style={styles.swipeNotchCutRight} />
                    <Text style={[styles.swipeHintText, isSubmitting && styles.swipeHintTextDone]}>
                      {isSubmitting ? 'Reserving...' : 'Swipe to tear and confirm reservation'}
                    </Text>
                    {!isSubmitting ? (
                      <Animated.View pointerEvents="none" style={[styles.swipeHintOverlay, { width: passedTextWidth }]}>
                        <View style={[styles.swipeHintOverlayTextWrap, { width: swipeWidth }]}>
                          <Text style={styles.swipeHintTextPassed}>Swipe to tear and confirm reservation</Text>
                        </View>
                      </Animated.View>
                    ) : null}
                    <Animated.View
                      style={[styles.swipeThumb, { transform: [{ translateX: dragX }] }]}
                      {...panResponder.panHandlers}>
                      <MaterialIcons name="chevron-right" size={22} color={colors.primary} />
                    </Animated.View>
                  </View>
                </View>
              </View>
            </Animated.View>
            <Animated.View
              onLayout={(e) => {
                setConfirmCardY(e.nativeEvent.layout.y);
              }}
              style={[
                styles.confirmPreviewWrap,
                isSubmitting && styles.confirmPreviewWrapExpanded,
                {
                  opacity: confirmOpacity,
                  transform: [{ translateY: confirmTranslateY }, { scale: confirmScale }],
                },
              ]}>
              <BookingSuccessCard colors={colors} compact={!isSubmitting} title='Confirm your booking' description='Swipe to lock in your table. Your confirmation ticket appears right after.'
              iconElement={<MaterialIcons name="schedule" size={25} color="#fff" />}/>
            </Animated.View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
