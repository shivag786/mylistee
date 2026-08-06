import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { PublicOffer } from '@/features/businesses/publicTypes'

/**
 * Fixed, always-the-same colour wheel: blue, red, yellow, green + six more.
 * Segment i always gets COLORS[i], so the wheel looks identical every render.
 */
const COLORS = [
  '#2563EB', // blue
  '#EF4444', // red
  '#FACC15', // yellow
  '#22C55E', // green
  '#8B5CF6', // purple
  '#FB923C', // orange
  '#06B6D4', // cyan
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F59E0B', // amber
]
const TEXT_ON = [
  '#FFFFFF', // blue
  '#FFFFFF', // red
  '#1E1E1E', // yellow
  '#FFFFFF', // green
  '#FFFFFF', // purple
  '#1E1E1E', // orange
  '#08313B', // cyan
  '#FFFFFF', // pink
  '#FFFFFF', // teal
  '#1E1E1E', // amber
]

/**
 * The wheel always shows a full ring of segments even with only one or two real
 * rewards, so it reads as a proper prize wheel. Empty slots are filled with these
 * display-only labels (never actually won — real offers occupy the first slots).
 */
const DISPLAY_LABELS = ['Coins', 'Bonus', 'Free item', 'Chance to win', 'Surprise', 'Jackpot', 'Cashback', 'Better luck']

/** Minimum segments so a 1–3 reward wheel still looks full and balanced. */
const MIN_SEGMENTS = 8

interface SpinnerWheelProps {
  offers: PublicOffer[]
  /** Index of the winning segment; when set, the wheel animates to it. */
  resultIndex: number | null
  spinning: boolean
  onRest: () => void
}

/** Mix a hex colour toward white (amount 0..1) — used for the 3D lit edge. */
function lighten(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 0xff
  const g = (n >> 8) & 0xff
  const b = n & 0xff
  const mix = (c: number) => Math.round(c + (255 - c) * amount)
  return `#${((1 << 24) + (mix(r) << 16) + (mix(g) << 8) + mix(b)).toString(16).slice(1)}`
}

/** Mix a hex colour toward black (amount 0..1) — the shaded outer rim. */
function darken(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 0xff
  const g = (n >> 8) & 0xff
  const b = n & 0xff
  const mix = (c: number) => Math.round(c * (1 - amount))
  return `#${((1 << 24) + (mix(r) << 16) + (mix(g) << 8) + mix(b)).toString(16).slice(1)}`
}

function slicePath(cx: number, cy: number, r: number, start: number, end: number): string {
  const a0 = ((start - 90) * Math.PI) / 180
  const a1 = ((end - 90) * Math.PI) / 180
  const x0 = cx + r * Math.cos(a0)
  const y0 = cy + r * Math.sin(a0)
  const x1 = cx + r * Math.cos(a1)
  const y1 = cy + r * Math.sin(a1)
  const large = end - start > 180 ? 1 : 0
  return `M${cx},${cy} L${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1} Z`
}

export function SpinnerWheel({ offers, resultIndex, spinning, onRest }: SpinnerWheelProps) {
  const reduce = useReducedMotion()
  const [rotation, setRotation] = useState(0)
  const size = 300
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 14

  // Real rewards first (so resultIndex still lands correctly), then display-only
  // filler slots to reach a full, always-balanced ring.
  const count = Math.max(offers.length, MIN_SEGMENTS)
  const segments = Array.from({ length: count }, (_, i) => {
    if (i < offers.length) {
      const o = offers[i]
      return { key: o.id, label: o.rewardValue || o.title }
    }
    return { key: `slot-${i}`, label: DISPLAY_LABELS[(i - offers.length) % DISPLAY_LABELS.length] }
  })
  const seg = 360 / count

  useEffect(() => {
    if (resultIndex === null) return
    // Land the winning segment's center under the top pointer, after several turns.
    const center = resultIndex * seg + seg / 2
    const target = 360 * 6 + (360 - center)
    setRotation((prev) => prev - (prev % 360) + target)
  }, [resultIndex, seg])

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      {/* Ambient glow behind the wheel — pulses gently while idle. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(37,99,235,0.4), rgba(236,72,153,0.25) 45%, transparent 70%)',
          filter: 'blur(18px)',
        }}
        animate={reduce ? undefined : { scale: [1, 1.06, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Pointer — glossy 3D teardrop with a glow. */}
      <div className="absolute left-1/2 top-[-10px] z-20 -translate-x-1/2" aria-hidden>
        <svg width={40} height={44} viewBox="0 0 40 44" style={{ filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.35))' }}>
          <defs>
            <linearGradient id="ptr" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFE08A" />
              <stop offset="45%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#B91C1C" />
            </linearGradient>
          </defs>
          <path d="M20 40 L6 12 A16 16 0 0 1 34 12 Z" fill="url(#ptr)" stroke="#fff" strokeWidth="1.5" />
          <ellipse cx="20" cy="14" rx="6" ry="4" fill="rgba(255,255,255,0.5)" />
        </svg>
      </div>

      <motion.svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        animate={{ rotate: reduce ? 0 : rotation }}
        transition={{ duration: reduce ? 0 : 4.6, ease: [0.16, 1, 0.3, 1] }}
        onAnimationComplete={() => {
          if (spinning) onRest()
        }}
        role="img"
        aria-label="Reward wheel"
        className="relative z-10"
        style={{ filter: 'drop-shadow(0 10px 22px rgba(0,0,0,0.28))' }}
      >
        <defs>
          {/* Per-segment radial gradient: lit inner core → shaded outer edge. */}
          {COLORS.map((c, i) => (
            <radialGradient key={i} id={`seg-${i}`} cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor={lighten(c, 0.35)} />
              <stop offset="65%" stopColor={c} />
              <stop offset="100%" stopColor={darken(c, 0.22)} />
            </radialGradient>
          ))}
          {/* Metallic gold rim. */}
          <linearGradient id="rim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFF1C1" />
            <stop offset="45%" stopColor="#F5C24B" />
            <stop offset="100%" stopColor="#B8860B" />
          </linearGradient>
        </defs>

        {/* Outer rim rings for depth. */}
        <circle cx={cx} cy={cy} r={r + 12} fill="url(#rim)" />
        <circle cx={cx} cy={cy} r={r + 6} fill="#7A5B08" opacity={0.35} />
        <circle cx={cx} cy={cy} r={r + 3} fill="#FFFFFF" />

        {/* Slices */}
        {segments.map((segment, i) => {
          const start = i * seg
          const end = start + seg
          const mid = start + seg / 2
          const labelAngle = ((mid - 90) * Math.PI) / 180
          const lr = r * 0.62
          const lx = cx + lr * Math.cos(labelAngle)
          const ly = cy + lr * Math.sin(labelAngle)
          const label = segment.label
          return (
            <g key={segment.key}>
              <path
                d={slicePath(cx, cy, r, start, end)}
                fill={`url(#seg-${i % COLORS.length})`}
                stroke="rgba(255,255,255,0.9)"
                strokeWidth={2}
              />
              <text
                x={lx}
                y={ly}
                fill={TEXT_ON[i % TEXT_ON.length]}
                fontSize={count > 8 ? 9 : 11}
                fontWeight={700}
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${mid}, ${lx}, ${ly})`}
                style={{ paintOrder: 'stroke', textShadow: '0 1px 1px rgba(0,0,0,0.25)' }}
              >
                {label.length > 13 ? `${label.slice(0, 12)}…` : label}
              </text>
            </g>
          )
        })}
      </motion.svg>

      {/* Static overlay — a fixed dome light + center hub that do NOT rotate. */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="pointer-events-none absolute inset-0 z-10"
        aria-hidden
      >
        <defs>
          <linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
            <stop offset="55%" stopColor="rgba(255,255,255,0.06)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <linearGradient id="rim2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFF1C1" />
            <stop offset="45%" stopColor="#F5C24B" />
            <stop offset="100%" stopColor="#B8860B" />
          </linearGradient>
          <radialGradient id="hub" cx="42%" cy="38%" r="70%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="55%" stopColor="#F3F4F6" />
            <stop offset="100%" stopColor="#C9CDD3" />
          </radialGradient>
        </defs>

        {/* Gloss sheen over the top half — sells the 3D dome. */}
        <path d={`M${cx - r},${cy} A${r},${r} 0 0 1 ${cx + r},${cy} Z`} fill="url(#gloss)" />

        {/* Center hub — lit dome with a gold ring. */}
        <circle cx={cx} cy={cy} r={24} fill="url(#rim2)" />
        <circle cx={cx} cy={cy} r={19} fill="url(#hub)" />
        <circle cx={cx} cy={cy} r={19} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={1} />
        <ellipse cx={cx - 5} cy={cy - 6} rx={7} ry={5} fill="rgba(255,255,255,0.7)" />
      </svg>
    </div>
  )
}
