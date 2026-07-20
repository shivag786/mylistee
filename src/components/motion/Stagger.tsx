import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { staggerContainer, staggerItem } from '@/animations'

interface StaggerProps {
  children: ReactNode
  className?: string
}

/** Container that reveals its <StaggerItem> children in sequence. */
export function Stagger({ children, className }: StaggerProps) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
    >
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
