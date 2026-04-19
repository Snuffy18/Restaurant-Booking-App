import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'onboardingComplete';

export async function getOnboardingComplete(): Promise<boolean> {
  const v = await AsyncStorage.getItem(KEY);
  return v === 'true';
}

export async function setOnboardingComplete(done: boolean): Promise<void> {
  await AsyncStorage.setItem(KEY, done ? 'true' : 'false');
}
