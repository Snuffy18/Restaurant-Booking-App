import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_VISITED_RESTAURANT_IDS_KEY = 'lastVisitedRestaurantIds';
const MAX_LAST_VISITED = 2;

export async function getLastVisitedRestaurantIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(LAST_VISITED_RESTAURANT_IDS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === 'string');
  } catch {
    return [];
  }
}

export async function pushLastVisitedRestaurantId(restaurantId: string): Promise<void> {
  const prev = await getLastVisitedRestaurantIds();
  const next = [restaurantId, ...prev.filter((id) => id !== restaurantId)].slice(0, MAX_LAST_VISITED);
  await AsyncStorage.setItem(LAST_VISITED_RESTAURANT_IDS_KEY, JSON.stringify(next));
}

export async function clearLastVisitedRestaurantIds(): Promise<void> {
  await AsyncStorage.removeItem(LAST_VISITED_RESTAURANT_IDS_KEY);
}
