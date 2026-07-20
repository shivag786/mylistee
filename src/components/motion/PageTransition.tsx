import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { pageTransition } from '@/animations'

/** Wraps a routed page so navigation fades/slides consistently. */
export function PageTransition({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion()
  if (reduce) return <>{children}</>

  return (
    <motion.div
      className="h-full"
      initial={pageTransition.initial}
      animate={pageTransition.animate}
      exit={pageTransition.exit}
    >
      {children}
    </motion.div>
  )
}
