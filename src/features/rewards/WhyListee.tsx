import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Award, BadgePercent, ChevronRight, Clock, Sparkles } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { useAppConfig } from '@/hooks/useAppConfig'

const BENEFITS = [
  { icon: BadgePercent, title: 'Shop discounts', text: 'Bill offers & coupons, applied in your cart' },
  { icon: Award, title: 'Loyalty stamps', text: 'Every few orders, a free reward' },
  { icon: Sparkles, title: 'Spin & win', text: 'Daily spins and Listee coins' },
  { icon: Clock, title: 'Skip the wait', text: 'Order ahead or right from your table' },
]

/**
 * For guests on the home page: what they gain by ordering through Listee
 * instead of at the counter, with one clear sign-up call. Signed-in
 * customers already know, so it doesn't render for them.
 */
export function WhyListee() {
  const reduce = useReducedMotion()
  const { data: config } = useAppConfig()
  const welcome = config?.coins?.welcome ?? 0
  const coinValue = config?.coins?.value ?? 1

  return (
    <section
      aria-labelledby="why-listee"
      className="overflow-hidden rounded-3xl bg-gradient-to-br from-secondary to-secondary-hover p-4 text-secondary-foreground shadow-premium sm:p-5"
    >
      <h2 id="why-listee" className="text-subtitle font-extrabold">Order on Listee, save every time</h2>
      <p className="mt-0.5 text-caption opacity-80">Same menu, same price — plus rewards you don’t get at the counter.</p>

      <div className="mt-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {BENEFITS.map((b, i) => (
          <motion.div
            key={b.title}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07 }}
            className="rounded-2xl bg-white/10 p-3 backdrop-blur"
          >
            <b.icon className="size-5 text-premium" aria-hidden />
            <p className="mt-1.5 text-caption font-bold">{b.title}</p>
            <p className="text-small opacity-80">{b.text}</p>
          </motion.div>
        ))}
      </div>

      <Link
        to={ROUTES.login}
        className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-gold px-4 py-3 text-gold-foreground transition-transform active:scale-[0.99]"
      >
        <span className="text-caption font-bold">
          {welcome > 0 ? `Sign up free · get ${welcome} coins (₹${welcome * coinValue})` : 'Sign up free to start earning'}
        </span>
        <ChevronRight className="size-5 shrink-0" aria-hidden />
      </Link>
    </section>
  )
}
