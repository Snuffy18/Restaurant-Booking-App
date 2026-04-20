import React, { useEffect } from 'react'
import { StyleSheet, View, Text } from 'react-native'
import MaskedView from '@react-native-masked-view/masked-view'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'

type ShimmerTextProps = {
  /** The text to display e.g. "Thinking..." */
  text?: string
  /** Base text colour — visible between shimmer sweeps */
  baseColor?: string
  /** Colour of the shimmer highlight sweep */
  shimmerColor?: string
  fontSize?: number
  fontWeight?: '400' | '500' | '600' | '700'
  /** Duration of one full shimmer sweep in ms. Defaults to 1600. */
  duration?: number
  /** Width of the shimmer strip relative to text container. Defaults to 0.4 (40%). */
  shimmerWidth?: number
  /**
   * How many pixels the text bounces up on each cycle.
   * Defaults to 4. Set to 0 to disable bounce.
   */
  bounceHeight?: number
  /**
   * How long one full bounce cycle takes in ms.
   * Defaults to 1600 — in sync with the shimmer sweep by default.
   */
  bounceDuration?: number
}

/**
 * ShimmerText
 *
 * Displays text with two layered animations running simultaneously:
 *
 *   1. Shimmer sweep — a bright highlight slides left to right through
 *      the letter shapes on a loop, like light reflecting off a surface.
 *
 *   2. Bounce — the entire text gently floats up then settles back down
 *      using a spring, giving it a soft breathing quality.
 *
 * The two animations are intentionally synced to the same duration so the
 * shimmer hits the letters right as the text peaks in its bounce.
 *
 * How the shimmer works:
 *   MaskedView uses the Text as a stencil — only letter pixels are visible.
 *   Inside, a solid base-colour fill sits behind an Animated gradient strip
 *   that sweeps across. The result: the shimmer lives entirely within the
 *   text outline and never bleeds into the background.
 *
 * How the bounce works:
 *   A separate translateY shared value runs withSequence — snap up with
 *   withSpring, then ease back down with withTiming — wrapped in withRepeat.
 *   Spring on the way up gives it a natural overshoot feel; timing on the
 *   way down gives a smooth landing.
 *
 * Dependencies:
 *   npx expo install @react-native-masked-view/masked-view
 *   npx expo install expo-linear-gradient
 *   npx expo install react-native-reanimated
 *
 * Usage:
 *   // Default — AI chat thinking indicator
 *   <ShimmerText text="Thinking..." />
 *
 *   // Slower, more relaxed
 *   <ShimmerText text="Thinking..." duration={2200} bounceDuration={2200} />
 *
 *   // Shimmer only, no bounce
 *   <ShimmerText text="Loading..." bounceHeight={0} />
 *
 *   // Bigger bounce
 *   <ShimmerText text="Thinking..." bounceHeight={7} />
 *
 *   // Bites themed
 *   <ShimmerText
 *     text="Earning Bites..."
 *     baseColor="#BA7517"
 *     shimmerColor="#F9CB42"
 *   />
 */
export const ShimmerText: React.FC<ShimmerTextProps> = ({
  text = 'Thinking...',
  baseColor = '#B4B2A9',
  shimmerColor = '#FFFFFF',
  fontSize = 14,
  fontWeight = '500',
  duration = 1600,
  shimmerWidth = 0.4,
  bounceHeight = 4,
  bounceDuration,
}) => {
  const totalBounceDuration = bounceDuration ?? duration
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const [containerWidth, setContainerWidth] = React.useState(200)

  // ── Shimmer sweep ──────────────────────────────────────────────
  useEffect(() => {
    translateX.value = 0
    translateX.value = withRepeat(
      withTiming(1, {
        duration,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      false
    )
  }, [duration])

  // ── Bounce ─────────────────────────────────────────────────────
  // withSequence: spring up → ease back to rest → brief pause at bottom
  useEffect(() => {
    if (bounceHeight === 0) return
    translateY.value = 0
    translateY.value = withRepeat(
      withSequence(
        // Snap up with a spring — natural overshoot on the rise
        withSpring(-bounceHeight, {
          damping: 6,
          stiffness: 120,
          mass: 0.6,
        }),
        // Ease back down smoothly
        withTiming(0, {
          duration: totalBounceDuration * 0.65,
          easing: Easing.out(Easing.quad),
        }),
        // Brief rest at the bottom before next bounce
        withTiming(0, {
          duration: totalBounceDuration * 0.15,
          easing: Easing.linear,
        })
      ),
      -1,
      false
    )
  }, [bounceHeight, totalBounceDuration])

  // ── Animated styles ───────────────────────────────────────────
  const shimmerStyle = useAnimatedStyle(() => {
    const stripWidth = containerWidth * shimmerWidth
    const startX = -stripWidth
    const endX = containerWidth + stripWidth
    return {
      transform: [
        { translateX: startX + translateX.value * (endX - startX) },
      ],
    }
  })

  const bounceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  const textStyle = {
    fontSize,
    fontWeight,
    color: baseColor,
  }

  return (
    <Animated.View style={[styles.container, bounceStyle]}>
      <View
        onLayout={e => setContainerWidth(e.nativeEvent.layout.width)}
        style={styles.inner}
      >
        <MaskedView
          style={styles.maskedView}
          maskElement={
            <View style={styles.maskContainer}>
              <Text style={[textStyle, { color: '#000000' }]}>{text}</Text>
            </View>
          }
        >
          {/* Base layer — solid text colour */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: baseColor }]} />

          {/* Shimmer strip */}
          <Animated.View style={[styles.shimmerStrip, shimmerStyle]}>
            <LinearGradient
              colors={['transparent', shimmerColor, shimmerColor, 'transparent']}
              locations={[0, 0.35, 0.65, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.gradient, { width: containerWidth * shimmerWidth }]}
            />
          </Animated.View>

          {/* Invisible text — sizes the MaskedView */}
          <Text style={[textStyle, { opacity: 0 }]}>{text}</Text>
        </MaskedView>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
  },
  inner: {
    alignSelf: 'flex-start',
  },
  maskedView: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  maskContainer: {
    backgroundColor: 'transparent',
  },
  shimmerStrip: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  gradient: {
    flex: 1,
  },
})

export default ShimmerText