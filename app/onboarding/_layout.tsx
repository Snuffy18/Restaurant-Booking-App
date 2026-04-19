import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="account" />
      <Stack.Screen name="cuisine" />
      <Stack.Screen name="vibe" />
      <Stack.Screen name="notifications" />
    </Stack>
  );
}
