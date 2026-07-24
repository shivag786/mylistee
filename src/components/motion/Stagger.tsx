import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { staggerContainer, staggerItem } from '@/animations'

interface StaggerProps {
  children: ReactNode
  className?: string
}

/**
 * Container that reveals its <StaggerItem> children in sequence.
 *
 * Drives children with `animate` (not `whileInView`): a scroll-gated reveal
 * leaves items that are added AFTER the first reveal stuck at their `hidden`
 * (opacity 0) variant — so freshly created products/combos/orders would be in
 * the DOM but invisible. With `animate="visible"` the parent always propagates
 * the visible state, so late-added children animate in too.
 */
export function Stagger({ children, className }: StaggerProps) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>

  return (
    <motion.div className={className} variants={staggerContainer} initial="hidden" animate="visible">
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className }: StaggerProps) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>
  return (
    <motion.div className={className} variants={staggerItem}>
      {children}
    </motion.div>
  )
}
