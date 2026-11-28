import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useAppConfig } from '@/hooks/useAppConfig'
import { useStoreScope } from '@/features/store/storeScope'
import { useCart, cartCount } from '@/features/orders/cartStore'

const PLAY_FALLBACK = 'https://play.google.com/store/apps/details?id=org.listee.app'
const KEY = 'listee:getapp:closedAt'
const QUIET_DAYS = 3

/** The real four-colour Google Play mark — trust at a glance. */
export function GooglePlayIcon({ className = 'size-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path fill="#00D7FE" d="M6.6 3.6c-.5.5-.8 1.3-.8 2.3v36.2c0 1 .3 1.8.8 2.3l.1.1L26.9 24.3v-.5L6.7 3.5l-.1.1z" />
      <path fill="#FFCE00" d="M33.6 31.1 26.9 24.3v-.5l6.7-6.8.2.1 8 4.5c2.3 1.3 2.3 3.4 0 4.7l-8 4.5-.2.3z" />
      <path fill="#FF3A44" d="M33.8 30.9 26.9 24 6.6 44.4c.8.8 2 .9 3.4.1l23.8-13.6" />
      <path fill="#00F076" d="M33.8 17.1 10 3.6c-1.4-.8-2.7-.7-3.4.1L26.9 24l6.9-6.9z" />
    </svg>
  )
}

export const isAndroid = () => typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent)
const isIos = () => typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent)

function closedRecently(): boolean {
  try {
    const at = Number(localStorage.getItem(KEY) || 0)
    return at > 0 && Date.now() - at < QUIET_DAYS * 86_400_000
  } catch {
    return false
  }
}

/**
 * "Get the Listee app" for people using the website: a card with the Google
 * Play mark and the reason to install (welcome coins, spin & win, order
 * alerts). Closing it shrinks it to a small floating pill for a few days, so it
 * never nags. Hidden on iPhone (no App Store app yet), in a shop's own store
 * mode, and while the cart bar is showing.
 */
export function GetAppBar() {
  const { data: config } = useAppConfig()
  const store = useStoreScope()
  const cartItems = cartCount(useCart())
  const [mode, setMode] = useState<'card' | 'pill' | 'hidden'>('hidden')

  useEffect(() => {
    if (isIos()) return
    const t = window.setTimeout(() => setMode(closedRecently() ? 'pill' : 'card'), 2500)
    return () => window.clearTimeout(t)
  }, [])

  const href = config?.apps?.customerPlayStore || PLAY_FALLBACK
  const coins = config?.welcomeCoins ?? 50
  if (store || cartItems > 0) return null

  function close() {
    try {
      localStorage.setItem(KEY, String(Date.now()))
    } catch {
      /* private mode: just collapse for now */
    }
    setMode('pill')
  }

  return (
    <AnimatePresence mode="wait">
      {mode === 'card' && (
        <motion.div
          key="card"
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 mx-auto w-full max-w-md px-3 lg:bottom-6"
        >
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-gray-900 via-gray-900 to-gray-800 p-3.5 text-white shadow-2xl ring-1 ring-white/10">
            <div aria-hidden className="pointer-events-none absolute -right-8 -top-10 size-32 rounded-full bg-amber-400/25 blur-2xl" />
            <button type="button" onClick={close} aria-label="Close" className="absolute right-2 top-2 grid size-7 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white">
              <X className="size-4" />
            </button>
            <div className="flex items-center gap-3 pr-6">
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white shadow-inner">
                <GooglePlayIcon className="size-8" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold leading-tight">Get the Listee app</p>
                <p className="text-small text-white/75">
                  <span className="font-bold text-amber-300">🪙 ₹{coins} coins free</span> on sign-up · spin &amp; win at every shop
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <a
                href={href}
                target="_blank"
                rel="noopener"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-3 py-2.5 font-bold text-gray-900 transition hover:bg-white/90"
              >
                <GooglePlayIcon className="size-5" />
                <span className="text-left leading-tight">
                  <span className="block text-[9px] font-semibold uppercase tracking-wider text-gray-500">Get it on</span>
                  <span className="block text-[15px]">Google Play</span>
                </span>
              </a>
              <ul className="hidden flex-1 space-y-0.5 text-[11px] text-white/70 min-[380px]:block">
                <li>✓ Coins on every order</li>
                <li>✓ Offers from shops nearby</li>
                <li>✓ Order ready alerts</li>
              </ul>
            </div>
          </div>
        </motion.div>
      )}
      {mode === 'pill' && (
        <motion.a
          key="pill"
          href={href}
          target="_blank"
          rel="noopener"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          aria-label={`Get the Listee app on Google Play — ₹${coins} coins free`}
          className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-3 z-40 flex items-center gap-2 rounded-full bg-gray-900 py-2 pl-2 pr-3.5 text-white shadow-xl ring-1 ring-white/10 lg:bottom-6"
        >
          <span className="grid size-8 place-items-center rounded-full bg-white">
            <GooglePlayIcon className="size-5" />
          </span>
          <span className="text-left leading-tight">
            <span className="block text-[12px] font-bold">Get app</span>
            <span className="block text-[10px] font-semibold text-amber-300">₹{coins} coins</span>
          </span>
        </motion.a>
      )}
    </AnimatePresence>
  )
}

