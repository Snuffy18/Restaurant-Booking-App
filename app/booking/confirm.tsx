import * as Calendar from 'expo-calendar';
import { router, useLocalSearchParams } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { useFocusEffect } from '@react-navigation/native';

import { BookingSuccessCard } from '@/components/BookingSuccessCard';
import type { AppColors } from '@/constants/Theme';
import { Radius, Spacing } from '@/constants/Theme';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { Booking, getRestaurant } from '@/data/mockData';
import { getBookingByRef } from '@/lib/bookingsStore';

function parseBookingDateTime(dateLabel: string, timeLabel: string): { startDate: Date; endDate: Date } {
  const now = new Date();
  const lowerDate = dateLabel.trim().toLowerCase();
  const monthMap: Record<string, number> = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11,
  };

  const [hourRaw, minuteRaw] = timeLabel.trim().split(':');
  const hours = Number(hourRaw);
  const minutes = Number(minuteRaw);
  const safeHours = Number.isFinite(hours) ? hours : 19;
  const safeMinutes = Number.isFinite(minutes) ? minutes : 30;

  let targetYear = now.getFullYear();
  let targetMonth = now.getMonth();
  let targetDay = now.getDate();

  if (lowerDate === 'tomorrow') {
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    targetYear = tomorrow.getFullYear();
    targetMonth = tomorrow.getMonth();
    targetDay = tomorrow.getDate();
  } else if (lowerDate !== 'today') {
    const explicitIso = dateLabel.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const shortFormat = dateLabel.match(/^(?:[A-Za-z]{3}\s+)?(\d{1,2})\s+([A-Za-z]{3,})$/);

    if (explicitIso) {
      targetYear = Number(explicitIso[1]);
      targetMonth = Number(explicitIso[2]) - 1;
      targetDay = Number(explicitIso[3]);
    } else if (shortFormat) {
      const day = Number(shortFormat[1]);
      const monthKey = shortFormat[2].slice(0, 3).toLowerCase();
      const month = monthMap[monthKey];
      if (Number.isFinite(day) && month != null) {
        targetDay = day;
        targetMonth = month;
      }
    }
  }

  const startDate = new Date(targetYear, targetMonth, targetDay, safeHours, safeMinutes, 0, 0);
  const endDate = new Date(startDate.getTime() + 90 * 60 * 1000);
  return { startDate, endDate };
}

async function getCalendarIdForEvents(): Promise<string> {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const writable = calendars.find((c) => c.allowsModifications);
  if (writable?.id) return writable.id;

  const defaultSource =
    calendars.find((c) => c.source)?.source ??
    ({
      isLocalAccount: true,
      name: 'Restaurant Booking App',
      type: Calendar.SourceType.LOCAL,
    } as Calendar.Source);

  return Calendar.createCalendarAsync({
    title: 'Restaurant bookings',
    color: '#EF9F27',
    entityType: Calendar.EntityTypes.EVENT,
    sourceId: defaultSource.id,
    source: defaultSource,
    name: 'restaurant-bookings',
    ownerAccount: 'personal',
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    confettiWrap: {
      position: 'absolute',
      top: -40,
      left: 0,
      right: 0,
      height: 210,
      zIndex: 2,
      pointerEvents: 'none',
    },
    confetti: {
      width: '100%',
      height: '100%',
    },
    scroll: { padding: Spacing.md, paddingBottom: Spacing.xl },
    ticket: {
      backgroundColor: c.card,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
    },
    ticketInner: { padding: Spacing.lg },
    restName: { fontSize: 22, fontWeight: '900', color: c.text, textAlign: 'center' },
    address: { marginTop: 6, color: c.textSecondary, textAlign: 'center' },
    dashed: {
      marginVertical: Spacing.lg,
      borderStyle: 'dashed',
      borderWidth: 1,
      borderColor: c.border,
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
    label: { color: c.textMuted, fontWeight: '600' },
    value: { color: c.text, fontWeight: '800' },
    requests: {
      marginTop: Spacing.md,
      backgroundColor: c.inputBg,
      padding: Spacing.md,
      borderRadius: Radius.md,
    },
    requestsLabel: { fontSize: 12, fontWeight: '800', color: c.textMuted, marginBottom: 6 },
    requestsBody: { color: c.textSecondary, lineHeight: 20 },
    perfRow: {
      marginTop: Spacing.lg,
      marginBottom: Spacing.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    perfDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.border },
    qrWrap: { alignItems: 'center', marginBottom: Spacing.md },
    ref: { textAlign: 'center', fontWeight: '900', color: c.text, letterSpacing: 1 },
    purpleStrip: {
      marginTop: Spacing.lg,
      backgroundColor: c.aiMuted,
      padding: Spacing.md,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: c.aiBorder,
    },
    purpleText: { color: c.ai, fontWeight: '600', lineHeight: 20 },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.lg },
    actionBtn: {
      flexGrow: 1,
      minWidth: '30%',
      backgroundColor: c.primary,
      paddingVertical: 12,
      borderRadius: Radius.md,
      alignItems: 'center',
    },
    actionBtnText: { color: '#fff', fontWeight: '900' },
    actionGhost: {
      flexGrow: 1,
      minWidth: '30%',
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      paddingVertical: 12,
      borderRadius: Radius.md,
      alignItems: 'center',
    },
    actionGhostText: { fontWeight: '800', color: c.text },
    done: { marginTop: Spacing.lg, alignItems: 'center', padding: Spacing.md },
    doneText: { color: c.ai, fontWeight: '900' },
  });
}

export default function BookingConfirmScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const params = useLocalSearchParams<{
    ref?: string;
    restaurantId?: string;
    tableName?: string;
    date?: string;
    time?: string;
    guests?: string;
    fromReview?: string;
  }>();
  const isFromReview = params.fromReview === '1';

  const [booking, setBooking] = useState<Booking | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      if (!isFromReview) {
        return undefined;
      }
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => {
        subscription.remove();
      };
    }, [isFromReview]),
  );

  useEffect(() => {
    let active = true;
    if (params.ref) {
      void getBookingByRef(String(params.ref)).then((b) => {
        if (active) setBooking(b);
      });
    } else {
      setBooking(undefined);
    }
    return () => {
      active = false;
    };
  }, [params.ref]);

  const restaurant = params.restaurantId ? getRestaurant(String(params.restaurantId)) : booking ? getRestaurant(booking.restaurantId) : undefined;

  const ref = params.ref ?? booking?.ref ?? '#TRM-00000';
  const tableName = params.tableName ?? booking?.tableName ?? 'Table';
  const restaurantName = restaurant?.name ?? booking?.restaurantName ?? 'Restaurant';
  const address = restaurant?.address ?? booking?.address ?? '';
  const date = params.date ?? booking?.date ?? 'Fri 23 May';
  const time = params.time ?? booking?.time ?? '19:30';
  const guests = params.guests ? Number(params.guests) : booking?.guests ?? 2;
  const special = booking?.specialRequests;
  const shouldShowConfetti = isFromReview;

  const qrPayload = JSON.stringify({ ref, restaurant: restaurantName, table: tableName });

  const addToCalendar = async () => {
    try {
      const permission = await Calendar.requestCalendarPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Calendar access needed', 'Please allow calendar access to add this reservation.');
        return;
      }

      const { startDate, endDate } = parseBookingDateTime(date, time);
      const calendarId = await getCalendarIdForEvents();

      await Calendar.createEventAsync(calendarId, {
        title: `${restaurantName} reservation`,
        startDate,
        endDate,
        location: address || undefined,
        notes: `Booking ref: ${ref}\nTable: ${tableName}\nGuests: ${guests}${special ? `\nSpecial requests: ${special}` : ''}`,
        alarms: [{ relativeOffset: -120 }],
      });

      Alert.alert('Added to calendar', 'Your booking has been added successfully.');
    } catch {
      Alert.alert('Could not add booking', 'Something went wrong while creating the calendar event.');
    }
  };

  const goToBookings = () => {
    router.dismissAll();
    router.replace('/(tabs)/bookings');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {shouldShowConfetti ? (
        <View style={styles.confettiWrap} pointerEvents="none">
          <LottieView source={require('@/assets/images/Confetti.json')} autoPlay loop={false} style={styles.confetti} />
        </View>
      ) : null}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <BookingSuccessCard colors={colors} />

        <View style={styles.ticket}>
          <View style={styles.ticketInner}>
            <Text style={styles.restName}>{restaurantName}</Text>
            <Text style={styles.address}>{address}</Text>
            <View style={styles.dashed} />
            <View style={styles.row}>
              <Text style={styles.label}>Date</Text>
              <Text style={styles.value}>{date}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Time</Text>
              <Text style={styles.value}>{time}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Guests</Text>
              <Text style={styles.value}>{guests}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Table</Text>
              <Text style={styles.value}>{tableName}</Text>
            </View>
            {special ? (
              <View style={styles.requests}>
                <Text style={styles.requestsLabel}>Special requests</Text>
                <Text style={styles.requestsBody}>{special}</Text>
              </View>
            ) : null}
            <View style={styles.perfRow}>
              {Array.from({ length: 12 }).map((_, i) => (
                <View key={i} style={styles.perfDot} />
              ))}
            </View>
            <View style={styles.qrWrap}>
              <QRCode value={qrPayload} size={180} color={colors.text} backgroundColor={colors.card} />
            </View>
            <Text style={styles.ref}>{ref}</Text>
          </View>
        </View>

        <View style={styles.purpleStrip}>
          <Text style={styles.purpleText}>Reminder · 2 hours before · Free cancel until 48h prior to your booking</Text>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>Show QR</Text>
          </Pressable>
          <Pressable style={styles.actionGhost} onPress={() => void addToCalendar()}>
            <Text style={styles.actionGhostText}>Add to calendar</Text>
          </Pressable>
          <Pressable style={styles.actionGhost}>
            <Text style={styles.actionGhostText}>Share</Text>
          </Pressable>
        </View>

        <Pressable onPress={goToBookings} style={styles.done}>
          <Text style={styles.doneText}>View my bookings</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
