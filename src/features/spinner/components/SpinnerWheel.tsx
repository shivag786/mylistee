import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { PublicOffer } from '@/features/businesses/publicTypes'

/** Brand-safe segment colors, cycled across the wheel. */
const COLORS = ['#E23744', '#3B82F6', '#22C55E', '#FBBF24', '#2D3436', '#F59E0B']
const TEXT_ON = ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#1E1E1E', '#FFFFFF', '#1E1E1E']

interface SpinnerWheelProps {
  offers: PublicOffer[]
  /** Index of the winning segment; when set, the wheel animates to it. */
  resultIndex: number | null
  spinning: boolean
  onRest: () => void
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
  const size = 280
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 6
  const count = Math.max(offers.length, 1)
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
      {/* Pointer */}
      <div
        className="absolute left-1/2 top-[-6px] z-10 -translate-x-1/2"
        style={{
          width: 0,
          height: 0,
          borderLeft: '12px solid transparent',
          borderRight: '12px solid transparent',
          borderTop: '20px solid #E23744',
          filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.25))',
        }}
        aria-hidden
      />
      <motion.svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        animate={{ rotate: reduce ? 0 : rotation }}
        transition={{ duration: reduce ? 0 : 4.2, ease: [0.16, 1, 0.3, 1] }}
        onAnimationComplete={() => {
          if (spinning) onRest()
        }}
        role="img"
        aria-label="Reward wheel"
        className="drop-shadow-md"
      >
        <circle cx={cx} cy={cy} r={r + 4} fill="#FFFFFF" />
        {offers.map((offer, i) => {
          const start = i * seg
          const end = start + seg
          const mid = start + seg / 2
          const labelAngle = ((mid - 90) * Math.PI) / 180
          const lr = r * 0.6
          const lx = cx + lr * Math.cos(labelAngle)
          const ly = cy + lr * Math.sin(labelAngle)
          const label = offer.rewardValue || offer.title
          return (
            <g key={offer.id}>
              <path d={slicePath(cx, cy, r, start, end)} fill={COLORS[i % COLORS.length]} stroke="#FFFFFF" strokeWidth={2} />
              <text
                x={lx}
                y={ly}
                fill={TEXT_ON[i % TEXT_ON.length]}
                fontSize={count > 6 ? 9 : 12}
                fontWeight={600}
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${mid}, ${lx}, ${ly})`}
              >
                {label.length > 14 ? `${label.slice(0, 13)}…` : label}
              </text>
            </g>
          )
        })}
        <circle cx={cx} cy={cy} r={16} fill="#FFFFFF" stroke="#E5E7EB" strokeWidth={2} />
      </motion.svg>
    </div>
  )
}
