import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/utils/cn'

/**
 * The Listee Coin — a lime coin with a midnight ₹, an inner rim and a light
 * sweep. Drawn in CSS (no image), so it follows the admin's reward colour.
 * The ₹ is there on purpose: a coin here is money, and it should look like it.
 */
export function ListeeCoin({ size = 24, shine = false, className }: { size?: number; shine?: boolean; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <span
      aria-hidden
      className={cn(
        'relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-gold to-gold-hover text-gold-foreground',
        'shadow-[inset_0_-2px_0_rgba(0,0,0,0.18),inset_0_2px_0_rgba(255,255,255,0.55),0_1px_2px_rgba(20,33,61,0.25)]',
        className,
      )}
      style={{ width: size, height: size }}
    >
      {/* inner rim */}
      <span className="absolute inset-[12%] rounded-full border border-current opacity-25" />
      <span className="relative font-heading font-black leading-none" style={{ fontSize: size * 0.52 }}>
        ₹
      </span>
      {shine && !reduce && (
        <motion.span
          className="absolute inset-y-0 w-1/3 -skew-x-12 bg-white/55"
          initial={{ x: -size }}
          animate={{ x: size * 1.4 }}
          transition={{ duration: 1.1, repeat: Infinity, repeatDelay: 2.6, ease: 'easeInOut' }}
        />
      )}
    </span>
  )
}
