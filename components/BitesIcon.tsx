import React from 'react'
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg'

type BitesIconProps = {
  size?: number
  /** Must be unique per screen instance to avoid SVG gradient conflicts.
   *  e.g. "bites-nav", "bites-profile", "bites-confirmation"
   *  Defaults to "bites-grad" — fine if only one icon is on screen at a time. */
  gradientId?: string
  /** The background colour this icon sits on — used to colour the bite cutout.
   *  Pass the exact surface colour: '#FFFFFF', '#FAEEDA', '#F1EFE8', etc. */
  backgroundColor?: string
  /** Set to true for locked / greyed-out states (e.g. locked rewards) */
  locked?: boolean
}

/**
 * BitesIcon — Honey Fire gradient variant
 *
 * A filled circle with a diagonal yellow-to-coral gradient and a circular
 * bite taken out of the top-right corner. The cutout is a plain circle
 * drawn on top in the background colour — pass `backgroundColor` to match
 * whatever surface the icon sits on.
 *
 * Gradient stops:
 *   0%   #F9CB42  — warm yellow
 *   100% #D85A30  — deep coral orange
 *
 * Usage:
 *   // Single instance (nav bar, simple badge)
 *   <BitesIcon />
 *
 *   // Multiple on same screen — always pass unique gradientId
 *   <BitesIcon size={16} gradientId="bites-history-row-1" />
 *   <BitesIcon size={16} gradientId="bites-history-row-2" />
 *
 *   // On a coloured surface
 *   <BitesIcon size={28} backgroundColor="#FAEEDA" gradientId="bites-header" />
 *
 *   // Locked / greyed reward
 *   <BitesIcon size={20} locked gradientId="bites-locked" />
 */
export const BitesIcon: React.FC<BitesIconProps> = ({
  size = 24,
  gradientId = 'bites-grad',
  backgroundColor = '#FFFFFF',
  locked = false,
}) => {
  const biteRadius = size * 0.27
  const biteCx = size * 0.78
  const biteCy = size * 0.22

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        {!locked && (
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#F9CB42" />
            <Stop offset="100%" stopColor="#D85A30" />
          </LinearGradient>
        )}
      </Defs>

      {/* Main circle — gradient when active, grey when locked */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2}
        fill={locked ? '#B4B2A9' : `url(#${gradientId})`}
      />

      {/* Bite cutout */}
      <Circle
        cx={biteCx}
        cy={biteCy}
        r={biteRadius}
        fill={backgroundColor}
      />
    </Svg>
  )
}

export default BitesIcon