import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { ACCENT_PRIMARY_BY_HEX } from '@/constants/AppAccent';
import { Radius, Spacing } from '@/constants/Theme';
import { useAppTheme } from '@/contexts/AppThemeContext';

function parseRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** `t` = 0 → `colorA`, 1 → `colorB` */
function mixHex(colorA: string, colorB: string, t: number): string {
  const A = parseRgb(colorA);
  const B = parseRgb(colorB);
  const r = Math.round(A.r + (B.r - A.r) * t);
  const g = Math.round(A.g + (B.g - A.g) * t);
  const bl = Math.round(A.b + (B.b - A.b) * t);
  return `#${[r, g, bl].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

const PARTICLE_LAYOUT = [
  { left: '6%', top: '14%', size: 5, delay: 0, drift: 10, duration: 3200 },
  { left: '22%', top: '72%', size: 4, delay: 400, drift: -8, duration: 2800 },
  { left: '44%', top: '10%', size: 6, delay: 120, drift: 6, duration: 3600 },
  { left: '58%', top: '58%', size: 4, delay: 600, drift: -12, duration: 3000 },
  { left: '72%', top: '22%', size: 5, delay: 280, drift: 9, duration: 3400 },
  { left: '88%', top: '68%', size: 4, delay: 900, drift: -7, duration: 3100 },
  { left: '14%', top: '48%', size: 3, delay: 500, drift: 5, duration: 2600 },
  { left: '92%', top: '38%', size: 5, delay: 200, drift: -9, duration: 3300 },
  { left: '36%', top: '82%', size: 4, delay: 750, drift: 11, duration: 2900 },
] as const;

function FloatingParticle({
  left,
  top,
  size,
  delay,
  drift,
  duration,
}: (typeof PARTICLE_LAYOUT)[number]) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
  }, [delay, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: (t.value - 0.5) * -18 },
      { translateX: (t.value - 0.5) * drift },
    ],
    opacity: 0.18 + t.value * 0.35,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.particle,
        { left, top, width: size, height: size, borderRadius: size / 2 },
        animatedStyle,
      ]}
    />
  );
}

export function AiHomeBanner() {
  const { accentHex, resolvedScheme } = useAppTheme();
  const p = ACCENT_PRIMARY_BY_HEX[accentHex];
  const darkNear = '#0c0c0c';
  const lightStops = [
    mixHex(p.primary, darkNear, 0.42),
    mixHex(p.primary, darkNear, 0.16),
    p.primary,
  ] as const;

  return (
    <Link href="/ai-chat" asChild>
      <Pressable style={({ pressed }) => [styles.outer, pressed && styles.outerPressed]}>
        <View style={styles.clip}>
          <LinearGradient
            {...(resolvedScheme === 'light'
              ? {
                  colors: [...lightStops],
                  locations: [0, 0.48, 1] as const,
                }
              : {
                  colors: [p.primaryMutedDark, p.primaryOnDark],
                })}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.particleLayer} pointerEvents="none">
            {PARTICLE_LAYOUT.map((cfg, i) => (
              <FloatingParticle key={i} {...cfg} />
            ))}
          </View>
          <View style={styles.content}>
            <View style={styles.head}>
              <Image
                source={require('../assets/images/ai-sparkles.png')}
                style={styles.sparkles}
                contentFit="contain"
                accessibilityLabel="AI"
              />
              <View style={styles.textCol}>
                <Text style={styles.title}>Not sure where to go?</Text>
                <Text style={styles.sub}>
                  Ask AI — describe the night you want in plain language.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  outerPressed: { opacity: 0.94 },
  clip: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  particleLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  particle: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  content: {
    position: 'relative',
    zIndex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  sparkles: {
    width: 32,
    height: 32,
    marginTop: 2,
    tintColor: '#FFFFFF',
  },
  textCol: {
    flex: 1,
    gap: Spacing.sm,
  },
  title: {
    fontWeight: '800',
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  sub: {
    color: 'rgba(255,255,255,0.92)',
    lineHeight: 22,
    fontSize: 15,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
