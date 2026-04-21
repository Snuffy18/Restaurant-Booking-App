import AsyncStorage from '@react-native-async-storage/async-storage';

const RESERVATION_PREFERENCES_KEY = 'reservationPreferences';

export type ReservationPreferences = {
  date: string;
  time: string;
  guests: number;
};

export async function getReservationPreferences(): Promise<ReservationPreferences | null> {
  const raw = await AsyncStorage.getItem(RESERVATION_PREFERENCES_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    const date = (parsed as { date?: unknown }).date;
    const time = (parsed as { time?: unknown }).time;
    const guests = (parsed as { guests?: unknown }).guests;
    if (typeof date !== 'string' || typeof time !== 'string' || typeof guests !== 'number') return null;
    return { date, time, guests };
  } catch {
    return null;
  }
}

export async function setReservationPreferences(next: ReservationPreferences): Promise<void> {
  await AsyncStorage.setItem(RESERVATION_PREFERENCES_KEY, JSON.stringify(next));
}
