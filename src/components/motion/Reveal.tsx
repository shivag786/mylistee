import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { fadeInUp } from '@/animations'

interface RevealProps {
  children: ReactNode
  className?: string
}

/** Fades + slides content up the first time it scrolls into view. */
export function Reveal({ children, className }: RevealProps) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
    >
      {children}
    </motion.div>
  )
}
