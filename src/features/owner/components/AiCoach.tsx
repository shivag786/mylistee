import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Copy, Lock, Send, Sparkles, X } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { AiPacksSheet } from './AiPacksSheet'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { ApiError } from '@/types/api'
import { toast } from '@/utils/toast'
import { cn } from '@/utils/cn'
import {
  aiCoachService,
  type AiAnswer,
  type AiTaskKind,
  type AiUsage,
  type CoachOverview,
  type CoachRoute,
  type CoachTip,
} from '../services/aiCoachService'

const VIOLET = 'bg-[#6D28D9] hover:bg-[#5B21B6] text-white'
const COACH_KEY = ['owner', 'ai-coach'] as const
const NUDGED_KEY = 'listee.aiCoach.nudged'
/** Seconds of real activity on the panel before the coach may speak up. */
const ACTIVE_SECONDS_BEFORE_NUDGE = 25

const ROUTE_OF: Record<CoachRoute, string> = {
  menuScan: `${ROUTES.owner.products}?scan=1`,
  products: ROUTES.owner.products,
  offers: ROUTES.owner.offers,
  qr: ROUTES.owner.qr,
  reviews: ROUTES.owner.reviews,
  advisor: ROUTES.owner.aiAdvisor,
  combos: ROUTES.owner.combos,
  notify: ROUTES.owner.notify,
}

const TASKS: { kind: AiTaskKind; label: string; ask?: { field: string; prompt: string } }[] = [
  { kind: 'offer_ideas', label: 'Offer ideas' },
  { kind: 'combo_ideas', label: 'Combo ideas' },
  { kind: 'sales_tips', label: 'Sell more this week' },
  { kind: 'push_message', label: 'Notification text' },
  { kind: 'product_description', label: 'Dish description', ask: { field: 'name', prompt: 'Which dish? Type its name below.' } },
  { kind: 'review_reply', label: 'Reply to a review', ask: { field: 'review', prompt: 'Paste the customer’s review below.' } },
]

const QUESTIONS = ['What are customers liking most?', 'Which dish is not selling?', 'How do I get more orders on slow days?']

type Msg =
  | { id: number; from: 'me'; text: string }
  | { id: number; from: 'ai'; text?: string; tips?: CoachTip[]; answers?: AiAnswer[]; cta?: 'plans' | 'ideas' | 'packs'; loading?: boolean }

let seq = 0
const nextId = () => ++seq

/**
 * The AI sales manager: a floating button on every owner page that opens a
 * chat. Every shop sees it — the tips are free (worked out from the shop's
 * own menu and orders); AI answers need the plan's AI module and count
 * against the monthly AI answers. It speaks up by itself at most a couple of
 * times a day (the server rations it) and only after the owner has been
 * active for a while.
 */
export function AiCoach() {
  const location = useLocation()
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const { user } = useAuth()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [nudge, setNudge] = useState<CoachTip | null>(null)
  const [packsOpen, setPacksOpen] = useState(false)

  const { data: coach } = useQuery({
    queryKey: COACH_KEY,
    queryFn: () => aiCoachService.overview(false),
    staleTime: 5 * 60_000,
  })

  useNudge(useCallback((tip: CoachTip) => setNudge(tip), []))

  const go = useCallback(
    (route: CoachRoute) => {
      setOpen(false)
      navigate(ROUTE_OF[route])
    },
    [navigate],
  )

  // The POS has its own bottom bar; keep it clear there.
  if (location.pathname.startsWith(ROUTES.owner.pos)) return null

  const dot = Boolean(nudge) || (coach?.pendingIdeas ?? 0) > 0

  return (
    <>
      <div className="fixed bottom-40 right-4 z-40 flex flex-col items-end gap-2 lg:bottom-28 lg:right-8">
        <AnimatePresence>
          {nudge && !open && (
            <motion.div
              role="status"
              initial={reduce ? false : { opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              className="w-72 rounded-2xl border border-border bg-surface p-4 text-foreground shadow-floating"
            >
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-[#6D28D9]" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-caption font-semibold">{nudge.title}</p>
                  <p className="mt-1 text-small text-text-secondary">{nudge.text}</p>
                </div>
                <button
                  type="button"
                  aria-label="Not now"
                  className="-m-1 rounded-full p-1 text-text-muted hover:text-foreground"
                  onClick={() => {
                    void aiCoachService.record('dismiss', nudge.id)
                    setNudge(null)
                  }}
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="rounded-full px-3 py-1.5 text-small text-text-secondary hover:text-foreground"
                  onClick={() => {
                    void aiCoachService.record('dismiss', nudge.id)
                    setNudge(null)
                  }}
                >
                  Not now
                </button>
                <button
                  type="button"
                  className={cn('rounded-full px-3 py-1.5 text-small font-semibold', VIOLET)}
                  onClick={() => {
                    void aiCoachService.record('open', nudge.id)
                    setOpen(true)
                  }}
                >
                  Show me
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open AI sales manager"
          className={cn(
            'relative flex h-12 items-center gap-2 rounded-full pl-3 pr-4 shadow-floating transition-transform hover:scale-105 active:scale-95',
            VIOLET,
          )}
        >
          <Sparkles className="size-5" aria-hidden />
          <span className="text-caption font-semibold">Ask AI</span>
          {dot && (
            <span className="absolute -right-0.5 -top-0.5 flex size-3.5" aria-hidden>
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#F59E0B] opacity-75" />
              <span className="relative inline-flex size-3.5 rounded-full border-2 border-white bg-[#F59E0B]" />
            </span>
          )}
        </button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          {open && (
            <CoachChat
              coach={coach}
              firstName={(user?.name ?? '').split(' ')[0]}
              focusTip={nudge}
              onRoute={go}
              onPlans={() => {
                setOpen(false)
                navigate(ROUTES.owner.subscription)
              }}
              onPacks={() => setPacksOpen(true)}
              onUsed={(usage) =>
                qc.setQueryData<CoachOverview>(COACH_KEY, (old) =>
                  old ? { ...old, ...usage, left: usage.left ?? Number.MAX_SAFE_INTEGER } : old,
                )
              }
              onOpened={() => setNudge(null)}
            />
          )}
        </SheetContent>
      </Sheet>
      <AiPacksSheet
        open={packsOpen}
        onOpenChange={setPacksOpen}
        onBought={() => void qc.invalidateQueries({ queryKey: COACH_KEY })}
      />
    </>
  )
}

/**
 * Asks the server for a nudge once per browser session, after the owner has
 * been active (tab visible, recent input) for a while. The server decides
 * whether today's nudges are used up, so this never costs AI tokens.
 */
function useNudge(onNudge: (tip: CoachTip) => void) {
  useEffect(() => {
    let asked = false
    try {
      asked = sessionStorage.getItem(NUDGED_KEY) === '1'
    } catch {
      /* private mode: ask anyway, the server still rations */
    }
    if (asked) return

    let active = 0
    let lastInput = Date.now()
    const touch = () => {
      lastInput = Date.now()
    }
    const events = ['pointerdown', 'keydown', 'scroll'] as const
    events.forEach((e) => window.addEventListener(e, touch, { passive: true }))

    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible' || Date.now() - lastInput > 60_000) return
      active += 5
      if (active < ACTIVE_SECONDS_BEFORE_NUDGE) return
      window.clearInterval(timer)
      try {
        sessionStorage.setItem(NUDGED_KEY, '1')
      } catch {
        /* ignore */
      }
      aiCoachService
        .overview(true)
        .then((o) => o.nudge && onNudge(o.nudge))
        .catch(() => {})
    }, 5_000)

    return () => {
      window.clearInterval(timer)
      events.forEach((e) => window.removeEventListener(e, touch))
    }
  }, [onNudge])
}

function CoachChat({
  coach,
  firstName,
  focusTip,
  onRoute,
  onPlans,
  onPacks,
  onUsed,
  onOpened,
}: {
  coach: CoachOverview | undefined
  firstName: string
  focusTip: CoachTip | null
  onRoute: (route: CoachRoute) => void
  onPlans: () => void
  onPacks: () => void
  onUsed: (usage: AiUsage) => void
  onOpened: () => void
}) {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [awaiting, setAwaiting] = useState<{ kind: AiTaskKind; field: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  // The greeting and today's tips, once the numbers are in.
  useEffect(() => {
    if (started.current || !coach) return
    started.current = true
    onOpened()
    const tips = focusTip ? [focusTip, ...coach.tips.filter((t) => t.id !== focusTip.id)] : coach.tips
    const hello: Msg[] = [
      {
        id: nextId(),
        from: 'ai',
        text: `Hi${firstName ? ` ${firstName}` : ''}! I’m your AI sales manager. I look at your menu and orders and tell you what to do next to sell more.`,
      },
    ]
    if (tips.length > 0) hello.push({ id: nextId(), from: 'ai', text: 'Here’s what I see in your shop today:', tips: tips.slice(0, 4) })
    if (coach.pendingIdeas > 0) {
      hello.push({
        id: nextId(),
        from: 'ai',
        text: `${coach.pendingIdeas} ready-made idea${coach.pendingIdeas === 1 ? ' is' : 's are'} waiting for you — offers and combos built from your orders. Approve with one tap.`,
        cta: 'ideas',
      })
    }
    if (!coach.inPlan) {
      hello.push({
        id: nextId(),
        from: 'ai',
        text: 'These tips are free. To get AI answers — offer ideas, combos, notification text, dish descriptions and replies to your questions — switch to a plan with the AI assistant.',
        cta: 'plans',
      })
    }
    setMsgs(hello)
  }, [coach, firstName, focusTip, onOpened])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [msgs])

  const say = (m: Omit<Extract<Msg, { from: 'ai' }>, 'id' | 'from'>) =>
    setMsgs((all) => [...all, { id: nextId(), from: 'ai', ...m }])

  async function run(kind: AiTaskKind, input: Record<string, string>) {
    if (!coach) return
    if (!coach.available) {
      say({ text: 'The AI is switched off right now. Please try again later.' })
      return
    }
    if (!coach.inPlan) {
      say({ text: 'AI answers are part of plans with the AI assistant. Your free tips stay here either way.', cta: 'plans' })
      return
    }
    if (coach.left <= 0) {
      say({ text: limitText(coach.resetsOn), cta: 'packs' })
      return
    }

    const id = nextId()
    setMsgs((all) => [...all, { id, from: 'ai', loading: true }])
    setBusy(true)
    try {
      const res = await aiCoachService.generate(kind, input)
      setMsgs((all) => all.map((m) => (m.id === id ? { id, from: 'ai', answers: res.suggestions } : m)))
      if (res.used !== undefined && res.limit !== undefined) {
        const { suggestions: _, ...usage } = res
        onUsed(usage as AiUsage)
      }
    } catch (err) {
      const reply: Extract<Msg, { from: 'ai' }> = { id, from: 'ai', text: 'Something went wrong. Please try again.' }
      if (err instanceof ApiError) {
        if (err.errors?.limit) Object.assign(reply, { text: limitText(coach.resetsOn), cta: 'packs' })
        else if (err.status === 403) Object.assign(reply, { text: err.message, cta: 'plans' })
        else reply.text = err.errors ? (Object.values(err.errors)[0]?.[0] ?? err.message) : err.message
      }
      setMsgs((all) => all.map((m) => (m.id === id ? reply : m)))
    } finally {
      setBusy(false)
    }
  }

  function pickTask(kind: AiTaskKind, preset?: Record<string, string>) {
    const task = TASKS.find((t) => t.kind === kind)
    setMsgs((all) => [...all, { id: nextId(), from: 'me', text: task?.label ?? 'Help me' }])
    if (task?.ask && !preset?.[task.ask.field]) {
      setAwaiting({ kind, field: task.ask.field })
      say({ text: task.ask.prompt })
      return
    }
    void run(kind, preset ?? {})
  }

  function submit(e?: FormEvent) {
    e?.preventDefault()
    const value = text.trim()
    if (!value || busy) return
    setText('')
    setMsgs((all) => [...all, { id: nextId(), from: 'me', text: value }])
    if (awaiting) {
      const a = awaiting
      setAwaiting(null)
      void run(a.kind, { [a.field]: value })
    } else {
      void run('ask', { question: value })
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 border-b border-border px-4 py-3 pr-12">
        <span className="grid size-9 place-items-center rounded-full bg-[#6D28D9] text-white">
          <Sparkles className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <SheetTitle className="text-body font-bold">AI sales manager</SheetTitle>
          <p className="text-small text-text-secondary">
            {!coach
              ? 'Loading…'
              : !coach.inPlan
                ? 'Free tips · AI answers on higher plans'
                : coach.unlimited
                  ? 'Unlimited AI answers on your plan'
                  : `${coach.left} AI answers left${coach.credits > 0 ? ` (incl. ${coach.credits} bought)` : ' this month'}`}
          </p>
        </div>
        {coach?.inPlan && !coach.unlimited && (
          <button type="button" onClick={onPacks} className="shrink-0 rounded-full border border-[#6D28D9]/40 px-3 py-1 text-small font-semibold text-[#5B21B6] hover:bg-[#6D28D9]/5">
            Buy more
          </button>
        )}
        {coach && !coach.inPlan && <Lock className="size-4 text-text-muted" aria-label="AI answers locked" />}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-background px-4 py-4" aria-live="polite">
        {msgs.map((m) =>
          m.from === 'me' ? (
            <div key={m.id} className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-br-md bg-[#6D28D9] px-3.5 py-2 text-caption text-white">{m.text}</p>
            </div>
          ) : (
            <div key={m.id} className="max-w-[92%] space-y-2">
              {m.loading && (
                <p className="inline-flex items-center gap-2 rounded-2xl rounded-bl-md bg-surface px-3.5 py-2.5 text-caption text-text-secondary shadow-soft">
                  <Sparkles className="size-4 animate-pulse text-[#6D28D9]" aria-hidden /> Thinking…
                </p>
              )}
              {m.text && (
                <p className="rounded-2xl rounded-bl-md bg-surface px-3.5 py-2.5 text-caption text-foreground shadow-soft">{m.text}</p>
              )}
              {m.tips?.map((tip) => (
                <div key={tip.id} className="rounded-2xl border border-border bg-surface p-3.5 shadow-soft">
                  <p className="text-caption font-semibold text-foreground">{tip.title}</p>
                  <p className="mt-1 text-small text-text-secondary">{tip.text}</p>
                  <button
                    type="button"
                    className="mt-2.5 inline-flex items-center gap-1 text-small font-semibold text-[#6D28D9] hover:underline"
                    onClick={() =>
                      tip.action.type === 'route' ? onRoute(tip.action.route) : pickTask(tip.action.task, tip.action.input)
                    }
                  >
                    {tip.action.label}
                    {tip.action.type === 'ai' && coach && !coach.inPlan ? (
                      <Lock className="size-3.5" aria-hidden />
                    ) : (
                      <ArrowRight className="size-3.5" aria-hidden />
                    )}
                  </button>
                </div>
              ))}
              {m.answers?.map((a, i) => (
                <AnswerCard key={i} answer={a} />
              ))}
              {m.cta === 'plans' && (
                <button type="button" onClick={onPlans} className={cn('rounded-full px-4 py-2 text-small font-semibold', VIOLET)}>
                  See plans
                </button>
              )}
              {m.cta === 'packs' && (
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={onPacks} className={cn('rounded-full px-4 py-2 text-small font-semibold', VIOLET)}>
                    Buy more AI answers
                  </button>
                  <button type="button" onClick={onPlans} className="rounded-full border border-border px-4 py-2 text-small font-semibold text-foreground hover:bg-surface-muted">
                    See plans
                  </button>
                </div>
              )}
              {m.cta === 'ideas' && (
                <button type="button" onClick={() => onRoute('advisor')} className={cn('rounded-full px-4 py-2 text-small font-semibold', VIOLET)}>
                  See AI ideas
                </button>
              )}
            </div>
          ),
        )}
        <div ref={endRef} />
      </div>

      <div className="space-y-2 border-t border-border bg-surface px-4 py-3">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {(msgs.length < 6 ? QUESTIONS.map((q) => ({ q })) : []).map(({ q }) => (
            <button
              key={q}
              type="button"
              disabled={busy}
              onClick={() => {
                setMsgs((all) => [...all, { id: nextId(), from: 'me', text: q }])
                void run('ask', { question: q })
              }}
              className="shrink-0 rounded-full border border-[#6D28D9]/30 bg-[#6D28D9]/5 px-3 py-1.5 text-small text-[#5B21B6] hover:bg-[#6D28D9]/10 disabled:opacity-50"
            >
              {q}
            </button>
          ))}
          {TASKS.map((t) => (
            <button
              key={t.kind}
              type="button"
              disabled={busy}
              onClick={() => pickTask(t.kind)}
              className="shrink-0 rounded-full border border-border px-3 py-1.5 text-small text-foreground hover:bg-surface-muted disabled:opacity-50"
            >
              {t.label}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="flex items-center gap-2">
          <label htmlFor="ai-coach-input" className="sr-only">
            Ask your AI sales manager
          </label>
          <input
            id="ai-coach-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={awaiting ? 'Type here…' : 'Ask anything about your sales…'}
            maxLength={500}
            className="h-11 min-w-0 flex-1 rounded-full border border-border bg-background px-4 text-caption text-foreground outline-none focus:border-[#6D28D9]"
          />
          <button
            type="submit"
            aria-label="Send"
            disabled={busy || !text.trim()}
            className={cn('grid size-11 shrink-0 place-items-center rounded-full disabled:opacity-50', VIOLET)}
          >
            <Send className="size-4" />
          </button>
        </form>
      </div>
    </>
  )
}

function limitText(resetsOn: string) {
  const date = new Date(resetsOn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  return `You have used all your AI answers for this month. Buy a pack to keep going now, or wait — they refresh on ${date}.`
}

function AnswerCard({ answer: a }: { answer: AiAnswer }) {
  const heading = a.title ?? a.name
  const body = a.text ?? a.body ?? a.description
  const plain = [
    heading,
    body,
    a.items?.join(', '),
    a.price !== undefined ? `₹${a.price}` : undefined,
    a.rewardValue,
    a.why,
    ...(a.steps ?? []).map((s) => `• ${s}`),
  ]
    .filter(Boolean)
    .join('\n')

  return (
    <div className="rounded-2xl rounded-bl-md bg-surface p-3.5 shadow-soft">
      {heading && (
        <p className="text-caption font-semibold text-foreground">
          {heading}
          {a.rewardValue && <span className="ml-2 text-[#5B21B6]">{a.rewardValue}</span>}
        </p>
      )}
      {body && <p className={cn('whitespace-pre-line text-caption text-foreground', heading && 'mt-1 text-text-secondary')}>{body}</p>}
      {a.items && a.items.length > 0 && (
        <p className="mt-1 text-small text-text-secondary">
          {a.items.join(' + ')}
          {a.price !== undefined && <span className="font-semibold text-foreground"> · ₹{a.price}</span>}
        </p>
      )}
      {a.why && <p className="mt-1 text-small text-text-muted">{a.why}</p>}
      {a.steps && a.steps.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-small text-foreground">
          {a.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      )}
      <button
        type="button"
        className="mt-2 inline-flex items-center gap-1 text-small text-text-muted hover:text-foreground"
        onClick={() => {
          void navigator.clipboard?.writeText(plain)
          toast.success('Copied')
        }}
      >
        <Copy className="size-3.5" aria-hidden /> Copy
      </button>
    </div>
  )
}
