import AsyncStorage from '@react-native-async-storage/async-storage';

import { Booking, MOCK_BOOKINGS } from '@/data/mockData';

const USER_BOOKINGS_KEY = 'userBookings';

function byNewestFirst(a: Booking, b: Booking): number {
  return Number(b.id.replace(/\D/g, '')) - Number(a.id.replace(/\D/g, ''));
}

export async function getUserBookings(): Promise<Booking[]> {
  const raw = await AsyncStorage.getItem(USER_BOOKINGS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((b): b is Booking => !!b && typeof b === 'object' && typeof (b as Booking).ref === 'string');
  } catch {
    return [];
  }
}

export async function upsertUserBooking(nextBooking: Booking): Promise<void> {
  const prev = await getUserBookings();
  const deduped = [nextBooking, ...prev.filter((b) => b.ref !== nextBooking.ref)];
  await AsyncStorage.setItem(USER_BOOKINGS_KEY, JSON.stringify(deduped));
}

export async function getAllBookings(): Promise<Booking[]> {
  const userBookings = await getUserBookings();
  const existingRefs = new Set(userBookings.map((b) => b.ref));
  const merged = [...userBookings, ...MOCK_BOOKINGS.filter((b) => !existingRefs.has(b.ref))];
  return merged.sort(byNewestFirst);
}

export async function getBookingByRef(ref: string): Promise<Booking | undefined> {
  const all = await getAllBookings();
  return all.find((b) => b.ref === ref);
}
