import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Copy, Gift, Sparkles, Store, X } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'
import { toast } from '@/utils/toast'
import { ordinal } from './format'
import { useRevealCard, useScratchCards } from './useRewards'
import type { ScratchCard } from './types'

/** Share of the foil that must be scratched off before the card opens by itself. */
const REVEAL_AT = 0.45

/** One gradient per order number, so a shop's 3rd / 5th / 6th cards look different. */
const FOILS = [
  'from-[#6a5af9] via-[#8b5cf6] to-[#d946ef]',
  'from-[#0ea5e9] via-[#2563eb] to-[#7c3aed]',
  'from-[#f97316] via-[#ef4444] to-[#db2777]',
  'from-[#10b981] via-[#0d9488] to-[#0284c7]',
  'from-[#f59e0b] via-[#f97316] to-[#e11d48]',
]

function foil(card: ScratchCard): string {
  return FOILS[(card.tierAt ?? 0) % FOILS.length]
}

function daysLeft(iso: string | null): string | null {
  if (!iso) return null
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
  if (days < 0) return null
  return days === 0 ? 'Expires today' : days === 1 ? 'Expires tomorrow' : `Expires in ${days} days`
}

/**
 * Loyalty rewards as GPay-style scratch cards: a grid of foil cards, each
 * opening into a card you scratch with a finger to find the reward and code.
 */
export function RewardCardsSection() {
  const { data: cards, isLoading, isError, refetch } = useScratchCards()
  const [openId, setOpenId] = useState<string | null>(null)
  const reduce = useReducedMotion()

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner size={28} label="Loading scratch cards" />
      </div>
    )
  }
  if (isError) return <ErrorState onRetry={() => void refetch()} />
  if (!cards || cards.length === 0) {
    return (
      <EmptyState
        icon={<Gift className="size-7" />}
        title="No scratch cards yet"
        description="Order again at your favourite shops — your 3rd, 5th… order unlocks a scratch card."
      />
    )
  }

  const fresh = cards.filter((c) => !c.revealed && c.status === 'active').length
  const open = cards.find((c) => c.id === openId) ?? null

  return (
    <div className="space-y-3 pt-1">
      {fresh > 0 && (
        <motion.p
          initial={reduce ? false : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary-soft to-gold-soft px-3.5 py-2.5 text-caption font-semibold text-foreground"
        >
          <Sparkles className="size-4 text-primary" aria-hidden />
          {fresh === 1 ? '1 card waiting to be scratched' : `${fresh} cards waiting to be scratched`}
        </motion.p>
      )}

      <ul className="grid grid-cols-2 gap-3">
        {cards.map((card, i) => (
          <motion.li
            key={card.id}
            initial={reduce ? false : { opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: Math.min(i, 8) * 0.05, type: 'spring', stiffness: 260, damping: 24 }}
          >
            <CardTile card={card} onOpen={() => setOpenId(card.id)} />
          </motion.li>
        ))}
      </ul>

      <ScratchDialog card={open} onClose={() => setOpenId(null)} />
    </div>
  )
}

/** A card in the grid: foil while unscratched, the reward once opened. */
function CardTile({ card, onOpen }: { card: ScratchCard; onOpen: () => void }) {
  const reduce = useReducedMotion()
  const dim = card.status !== 'active'

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      layoutId={reduce ? undefined : `scratch-${card.id}`}
      whileTap={{ scale: 0.97 }}
      className={cn(
        'relative flex aspect-square w-full flex-col overflow-hidden rounded-3xl p-3.5 text-left shadow-soft',
        card.revealed ? 'bg-surface ring-1 ring-border' : cn('bg-gradient-to-br text-white', foil(card)),
        dim && 'opacity-60 grayscale',
      )}
    >
      {card.revealed ? (
        <>
          <ShopBadge card={card} />
          <p className="mt-auto text-subtitle font-extrabold leading-tight text-foreground">{card.label}</p>
          <p className="mt-1 text-small text-text-secondary">
            {card.status === 'used' ? 'Used' : card.status === 'expired' ? 'Expired' : daysLeft(card.expiresAt) ?? 'Ready to use'}
          </p>
        </>
      ) : (
        <>
          <FoilPattern />
          <span className="relative text-[11px] font-bold uppercase tracking-wider opacity-90">
            {card.tierAt ? `${ordinal(card.tierAt)} order` : 'Reward'}
          </span>
          <motion.span
            className="relative m-auto grid size-14 place-items-center rounded-2xl bg-white/20 backdrop-blur-sm"
            animate={reduce || dim ? undefined : { rotate: [0, -6, 6, -3, 0], scale: [1, 1.06, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 2.2 }}
          >
            <Gift className="size-7" aria-hidden />
          </motion.span>
          <span className="relative truncate text-caption font-semibold opacity-95">{card.business?.name ?? 'Shop reward'}</span>
          <span className="relative text-[11px] opacity-80">{dim ? (card.status === 'used' ? 'Used' : 'Expired') : 'Tap to scratch'}</span>
        </>
      )}
    </motion.button>
  )
}

function ShopBadge({ card }: { card: ScratchCard }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-surface-muted">
        {card.business?.logo ? (
          <img src={card.business.logo} alt="" className="size-full object-cover" />
        ) : (
          <Store className="size-4 text-text-muted" aria-hidden />
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-small font-semibold text-foreground">{card.business?.name ?? 'Shop'}</span>
        {card.tierAt && <span className="block text-[11px] text-text-muted">{ordinal(card.tierAt)} order reward</span>}
      </span>
    </span>
  )
}

/** Soft sparkles on the foil. Decorative. */
function FoilPattern() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      <span className="absolute -right-6 -top-6 size-24 rounded-full bg-white/15" />
      <span className="absolute -bottom-8 -left-4 size-28 rounded-full bg-white/10" />
      <span className="absolute right-5 top-1/2 size-2 rounded-full bg-white/60" />
      <span className="absolute left-6 top-8 size-1.5 rounded-full bg-white/50" />
    </span>
  )
}

/* ------------------------------------------------------------- scratch -- */

function ScratchDialog({ card, onClose }: { card: ScratchCard | null; onClose: () => void }) {
  return (
    <Dialog open={card !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton={false} className="max-w-[22rem] border-0 bg-transparent p-0 shadow-none">
        <DialogTitle className="sr-only">Scratch card</DialogTitle>
        <DialogDescription className="sr-only">Scratch the card to reveal your reward.</DialogDescription>
        {card && <ScratchBody key={card.id} card={card} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

function ScratchBody({ card, onClose }: { card: ScratchCard; onClose: () => void }) {
  const reduce = useReducedMotion()
  const reveal = useRevealCard()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)
  const strokes = useRef(0)
  // Open from the start for a card already scratched.
  const [opened, setOpened] = useState(card.revealed)
  const [celebrate, setCelebrate] = useState(false)

  // Paint the foil the customer scratches away.
  useEffect(() => {
    if (opened) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const ratio = window.devicePixelRatio || 1
    // Layout size, not the on-screen box: the dialog is still zooming in here.
    const width = canvas.offsetWidth
    const height = canvas.offsetHeight
    canvas.width = width * ratio
    canvas.height = height * ratio
    ctx.scale(ratio, ratio)

    const g = ctx.createLinearGradient(0, 0, width, height)
    g.addColorStop(0, '#b8bcc8')
    g.addColorStop(0.5, '#e6e8ee')
    g.addColorStop(1, '#a3a8b6')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, width, height)
    // A sprinkle of glitter so it reads as foil.
    for (let i = 0; i < 140; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.25 + Math.random() * 0.5})`
      ctx.fillRect(Math.random() * width, Math.random() * height, 1.5, 1.5)
    }
    ctx.fillStyle = 'rgba(55,60,75,0.75)'
    ctx.font = '600 15px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Scratch here', width / 2, height / 2 + 5)
  }, [opened])

  function ensureRevealed() {
    if (card.revealed || reveal.isPending || reveal.isSuccess) return
    reveal.mutate(card.id, {
      onError: () => toast.error('Couldn’t open the card. Check your connection and try again.'),
    })
  }

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    // Map screen pixels to the canvas's own, whatever scale it is shown at.
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) * el.offsetWidth) / (rect.width || 1),
      y: ((e.clientY - rect.top) * el.offsetHeight) / (rect.height || 1),
    }
  }

  function scratch(to: { x: number; y: number }) {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    ctx.globalCompositeOperation = 'destination-out'
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 38
    ctx.beginPath()
    const from = last.current ?? to
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()
    last.current = to
    if (++strokes.current % 8 === 0) checkCleared()
  }

  /** Sample the foil; once enough is gone, open the rest. */
  function checkCleared() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
    let clear = 0
    let total = 0
    for (let i = 3; i < data.length; i += 4 * 32) {
      total++
      if (data[i] === 0) clear++
    }
    if (total > 0 && clear / total >= REVEAL_AT) finish()
  }

  function finish() {
    ensureRevealed()
    setOpened(true)
    setCelebrate(true)
    navigator.vibrate?.(30)
    window.setTimeout(() => setCelebrate(false), 1400)
  }

  const shown = reveal.data ?? card
  const ready = shown.revealed && shown.label

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute -top-12 right-0 grid size-10 place-items-center rounded-full bg-white/90 text-foreground shadow"
      >
        <X className="size-5" aria-hidden />
      </button>

      <motion.div
        layoutId={reduce ? undefined : `scratch-${card.id}`}
        className="relative overflow-hidden rounded-[28px] bg-surface shadow-2xl"
      >
        {/* What's under the foil */}
        <div className="flex aspect-square flex-col items-center justify-center gap-2 p-6 text-center">
          <ShopBadge card={shown} />
          <AnimatePresence mode="wait">
            {ready ? (
              <motion.div
                key="reward"
                initial={reduce ? false : { scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                className="mt-3 space-y-1"
              >
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">You won</p>
                <p className="bg-gradient-to-r from-primary to-premium bg-clip-text text-[2rem] font-black leading-none text-transparent">
                  {shown.label}
                </p>
                {shown.minBill ? <p className="text-small text-text-secondary">on bills above ₹{shown.minBill}</p> : null}
              </motion.div>
            ) : (
              <motion.div key="wait" className="mt-3 h-16 w-40 animate-pulse rounded-xl bg-surface-muted" />
            )}
          </AnimatePresence>
        </div>

        {/* The foil */}
        <AnimatePresence>
          {!opened && (
            <motion.canvas
              ref={canvasRef}
              exit={{ opacity: 0, scale: 1.04 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 size-full cursor-grab touch-none rounded-[28px]"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId)
                drawing.current = true
                last.current = point(e)
                ensureRevealed()
                scratch(point(e))
              }}
              onPointerMove={(e) => drawing.current && scratch(point(e))}
              onPointerUp={() => {
                drawing.current = false
                last.current = null
                checkCleared()
              }}
              onPointerCancel={() => {
                drawing.current = false
                last.current = null
              }}
            />
          )}
        </AnimatePresence>

        {celebrate && !reduce && <Burst />}
      </motion.div>

      <div className="mt-4 space-y-2">
        {!opened ? (
          <Button fullWidth variant="secondary" onClick={finish}>
            Reveal without scratching
          </Button>
        ) : ready && shown.status === 'active' ? (
          <motion.div initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(shown.code ?? '').catch(() => undefined)
                toast.success(`${shown.code} copied`, 'Pick it in your cart at this shop.')
              }}
              className="flex w-full items-center justify-between rounded-2xl border-2 border-dashed border-white/70 bg-white/95 px-4 py-3 text-left"
            >
              <span>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-text-muted">Code</span>
                <span className="font-mono text-body-lg font-extrabold tracking-widest text-primary">{shown.code}</span>
              </span>
              <Copy className="size-5 text-primary" aria-hidden />
            </button>
            {shown.business && (
              <Button asChild fullWidth>
                <Link to={ROUTES.businessProfile(shown.business.slug)} onClick={onClose}>
                  Use at {shown.business.name}
                </Link>
              </Button>
            )}
            {daysLeft(shown.expiresAt) && <p className="text-center text-small text-white/90">{daysLeft(shown.expiresAt)}</p>}
          </motion.div>
        ) : ready ? (
          <p className="rounded-2xl bg-white/90 py-2.5 text-center text-caption font-semibold text-text-secondary">
            {shown.status === 'used' ? 'You’ve used this reward.' : 'This reward has expired.'}
          </p>
        ) : null}
      </div>
    </div>
  )
}

/** A quick confetti pop from the middle of the card. */
function Burst() {
  const colors = ['#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#facc15']
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
      {Array.from({ length: 22 }).map((_, i) => {
        const angle = (i / 22) * Math.PI * 2
        const dist = 90 + (i % 4) * 22
        return (
          <motion.span
            key={i}
            className="absolute block rounded-sm"
            style={{ width: i % 3 ? 7 : 10, height: i % 3 ? 7 : 4, background: colors[i % colors.length] }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.6 }}
            animate={{
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist + 30,
              opacity: 0,
              rotate: (i % 2 ? 1 : -1) * 220,
              scale: 1,
            }}
            transition={{ duration: 1.1, ease: [0.2, 0.7, 0.3, 1] }}
          />
        )
      })}
    </div>
  )
}
