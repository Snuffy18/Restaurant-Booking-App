import { useFocusEffect } from 'expo-router';
import { ReactNode, useCallback } from 'react';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type Props = { children: ReactNode };

/** Opacity + slight lift so tab switches read clearly without feeling heavy */
const OPACITY_FROM = 0.55;
const TRANSLATE_FROM = 12;
const DURATION_MS = 380;

export function TabScreenFade({ children }: Props) {
  const opacity = useSharedValue(OPACITY_FROM);
  const translateY = useSharedValue(TRANSLATE_FROM);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      opacity.value = OPACITY_FROM;
      translateY.value = TRANSLATE_FROM;

      // Defer `withTiming` one frame so the dimmed start state actually paints (same-tick assign skips it).
      const id = requestAnimationFrame(() => {
        if (cancelled) return;
        opacity.value = withTiming(1, {
          duration: DURATION_MS,
          easing: Easing.out(Easing.cubic),
        });
        translateY.value = withTiming(0, {
          duration: DURATION_MS,
          easing: Easing.out(Easing.cubic),
        });
      });

      return () => {
        cancelled = true;
        cancelAnimation(opacity);
        cancelAnimation(translateY);
        cancelAnimationFrame(id);
      };
    }, [opacity, translateY]),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]} collapsable={false}>
      {children}
    </Animated.View>
  );
}
