import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const COLORS = ['bg-primary', 'bg-gold', 'bg-success', 'bg-info', 'bg-premium', 'bg-secondary']

interface Piece {
  id: number
  left: number
  color: string
  width: number
  height: number
  rotate: number
  sway: number
  duration: number
  delay: number
  round: boolean
}

function makePieces(count: number): Piece[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    left: Math.random() * 100,
    color: COLORS[id % COLORS.length],
    width: 6 + Math.random() * 6,
    height: 8 + Math.random() * 10,
    rotate: (Math.random() - 0.5) * 900,
    sway: (Math.random() - 0.5) * 120,
    duration: 2.2 + Math.random() * 1.6,
    delay: Math.random() * 0.5,
    round: Math.random() < 0.3,
  }))
}

/**
 * A one-off shower of confetti over the whole screen. Decorative: it ignores
 * pointer events and renders nothing for people who prefer reduced motion.
 */
export function Confetti({ count = 70 }: { count?: number }) {
  const reduce = useReducedMotion()
  const [pieces] = useState(() => makePieces(count))
  if (reduce) return null

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className={`absolute top-0 block ${p.color} ${p.round ? 'rounded-full' : 'rounded-[2px]'}`}
          style={{ left: `${p.left}%`, width: p.width, height: p.round ? p.width : p.height }}
          initial={{ y: '-5vh', x: 0, rotate: 0, opacity: 1 }}
          animate={{ y: '105vh', x: [0, p.sway, -p.sway / 2, p.sway / 3], rotate: p.rotate, opacity: [1, 1, 1, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  )
}
