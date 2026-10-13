import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, ChevronDown, ImageOff, MessageSquareOff, ShoppingBag } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar } from '@/components/ui/avatar'
import { Logo } from '@/components/icons/Logo'
import { StarInput } from '@/components/forms/StarInput'
import { Spinner } from '@/components/feedback/Spinner'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Confetti } from '@/components/motion/Confetti'
import { SuccessCheck } from '@/components/media/SuccessCheck'
import { DishPhoto } from '@/features/businesses/components/dish/DishPhoto'
import {
  reviewLinkService,
  type ReviewLinkInput,
  type ReviewLinkItem,
} from '@/features/businesses/services/reviewLinkService'
import { staggerContainer, staggerItem } from '@/animations'
import { usePageTitle } from '@/hooks/usePageTitle'
import { ROUTES } from '@/constants/routes'
import { ApiError } from '@/types/api'
import { MESSAGES } from '@/constants/messages'
import { cn } from '@/utils/cn'

/** Items to rate shown at first, and how many more each "Load more" adds. */
const ITEMS_STEP = 4
/** Cards on the thank-you screen. */
const SUGGESTIONS = 4

const itemKey = (item: Pick<ReviewLinkItem, 'type' | 'id'>) => `${item.type}:${item.id}`

/** Mirrors the server: drop spaces/dashes, a leading 0 or +91, then 10 digits from 6–9. */
function isValidMobile(input: string): boolean {
  let digits = input.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2)
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1)
  return /^[6-9]\d{9}$/.test(digits)
}

/**
 * A shop's public review link, opened from WhatsApp or a QR by someone with no
 * account. Mobile number is the only required field; the overall star, the text
 * review and per-item stars are each optional, but at least one is needed.
 * After posting: confetti, a thank-you, and a few of the shop's dishes to try.
 */
export function ReviewLinkPage() {
  const { slug = '' } = useParams()
  const shop = useQuery({
    queryKey: ['review-link', slug],
    queryFn: () => reviewLinkService.get(slug),
    enabled: Boolean(slug),
    retry: (count, err) => !(err instanceof ApiError && err.status === 404) && count < 2,
  })
  usePageTitle(shop.data ? `Review ${shop.data.name}` : 'Leave a review')

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
        {shop.isLoading ? (
          <div className="flex min-h-[60dvh] items-center justify-center">
            <Spinner size={32} label="Loading" />
          </div>
        ) : shop.isError ? (
          shop.error instanceof ApiError && shop.error.status === 404 ? (
            <EmptyState
              icon={<MessageSquareOff className="size-7" />}
              title="This review link isn't active"
              description="The shop may have moved or closed. Ask them for a new link."
            />
          ) : (
            <ErrorState onRetry={() => void shop.refetch()} />
          )
        ) : shop.data ? (
          <ReviewFlow slug={slug} name={shop.data.name} logoUrl={shop.data.logoUrl} items={shop.data.items} />
        ) : null}
      </main>
      <footer className="flex justify-center pb-28">
        <Link to={ROUTES.home} className="inline-flex items-center gap-1.5 text-small text-text-muted">
          <span>Powered by</span>
          <Logo size={18} showWordmark />
        </Link>
      </footer>
    </div>
  )
}

function ReviewFlow({
  slug,
  name: shopName,
  logoUrl,
  items,
}: {
  slug: string
  name: string
  logoUrl: string | null
  items: ReviewLinkItem[]
}) {
  const reduce = useReducedMotion()
  const phoneRef = useRef<HTMLInputElement>(null)
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [itemRatings, setItemRatings] = useState<Record<string, number>>({})
  const [visibleCount, setVisibleCount] = useState(ITEMS_STEP)
  const [website, setWebsite] = useState('')
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const submit = useMutation({
    mutationFn: (input: ReviewLinkInput) => reviewLinkService.submit(slug, input),
  })

  const ratedItems = useMemo(
    () =>
      items
        .filter((item) => (itemRatings[itemKey(item)] ?? 0) > 0)
        .map((item) => ({ type: item.type, id: item.id, rating: itemRatings[itemKey(item)] })),
    [items, itemRatings],
  )
  const phoneOk = isValidMobile(phone)
  const hasContent = rating > 0 || comment.trim() !== '' || ratedItems.length > 0

  // Land on the thank-you from the top, not wherever the form was scrolled.
  useEffect(() => {
    if (submit.isSuccess) window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }, [submit.isSuccess, reduce])

  async function handleSubmit() {
    if (!phoneOk) {
      setErrors({ phone: [phone.trim() ? 'Enter a valid 10-digit mobile number.' : 'Enter your mobile number to post.'] })
      phoneRef.current?.focus()
      phoneRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' })
      return
    }
    if (!hasContent) {
      setErrors({ comment: ['Add a star rating or write a few words.'] })
      return
    }
    setErrors({})
    try {
      await submit.mutateAsync({
        phone: phone.trim(),
        name: name.trim() || undefined,
        rating: rating > 0 ? rating : undefined,
        comment: comment.trim() || undefined,
        items: ratedItems.length > 0 ? ratedItems : undefined,
        website: website || undefined,
      })
    } catch (err) {
      if (err instanceof ApiError && err.errors) setErrors(err.errors)
      else setErrors({ form: [err instanceof ApiError ? err.message : MESSAGES.errors.generic] })
    }
  }

  if (submit.isSuccess) {
    return <ThankYou slug={slug} shopName={shopName} reviewerName={name.trim()} items={items} ratedKeys={itemRatings} />
  }

  const fieldError = (key: string) => (
    <AnimatePresence>
      {errors[key]?.[0] && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="text-small text-destructive"
        >
          {errors[key][0]}
        </motion.p>
      )}
    </AnimatePresence>
  )

  const shownItems = items.slice(0, visibleCount)
  const remaining = items.length - visibleCount

  return (
    <motion.form
      onSubmit={(e) => {
        e.preventDefault()
        void handleSubmit()
      }}
      className="space-y-5"
      noValidate
      variants={reduce ? undefined : staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.header variants={staggerItem} className="flex flex-col items-center gap-3 pt-2 text-center">
        <Avatar name={shopName} src={logoUrl} size="lg" />
        <div>
          <h1 className="text-title font-bold text-foreground">How was {shopName}?</h1>
          <p className="text-caption text-text-secondary">Your review helps the shop and other customers.</p>
        </div>
      </motion.header>

      {/* Mobile first — it's the one required field. */}
      <motion.div variants={staggerItem}>
        <Card className="space-y-3" padding="lg">
          <label className="block space-y-1">
            <span className="text-caption font-medium text-foreground">
              Mobile number <span className="text-destructive">*</span>
            </span>
            <Input
              ref={phoneRef}
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value)
                if (errors.phone) setErrors(({ phone: _drop, ...rest }) => rest)
              }}
              placeholder="98765 43210"
              maxLength={16}
              aria-invalid={Boolean(errors.phone)}
              required
            />
            {fieldError('phone')}
            <p className="text-small text-text-muted">Only the shop sees your number. It isn't shown with your review.</p>
          </label>
          <label className="block space-y-1">
            <span className="text-caption font-medium text-foreground">Your name (optional)</span>
            <Input
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              aria-invalid={Boolean(errors.name)}
            />
            {fieldError('name')}
          </label>

          {/* Honeypot: hidden from people, filled by bots. */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="absolute -left-[9999px] size-px opacity-0"
            aria-hidden
          />
        </Card>
      </motion.div>

      <motion.div variants={staggerItem}>
        <Card className="space-y-4" padding="lg">
          <div className="flex flex-col items-center gap-1">
            <StarInput value={rating} onChange={setRating} clearable label="Rate the shop" />
            <p className="text-small text-text-muted">
              {rating > 0 ? 'Tap the same star again to clear' : 'Tap to rate (optional)'}
            </p>
          </div>

          <label className="block space-y-1">
            <span className="text-caption font-medium text-foreground">Your review</span>
            <Textarea
              value={comment}
              onChange={(e) => {
                setComment(e.target.value)
                if (errors.comment) setErrors(({ comment: _drop, ...rest }) => rest)
              }}
              rows={4}
              maxLength={1000}
              placeholder="What did you like? What could be better?"
              aria-invalid={Boolean(errors.comment)}
            />
            {fieldError('comment')}
          </label>
        </Card>
      </motion.div>

      {items.length > 0 && (
        <motion.div variants={staggerItem}>
          <Card className="space-y-3" padding="lg">
            <div>
              <h2 className="text-body font-semibold text-foreground">Rate what you had</h2>
              <p className="text-caption text-text-secondary">Optional — only rate the items you tried.</p>
            </div>
            <ul className="divide-y divide-border">
              <AnimatePresence initial={false}>
                {shownItems.map((item, i) => {
                  const key = itemKey(item)
                  return (
                    <motion.li
                      key={key}
                      initial={reduce ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i >= visibleCount - ITEMS_STEP ? (i % ITEMS_STEP) * 0.06 : 0 }}
                      className="flex items-center gap-3 py-2.5"
                    >
                      <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-muted">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt="" className="size-full object-cover" loading="lazy" />
                        ) : (
                          <ImageOff className="size-5 text-text-muted" aria-hidden />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-caption font-medium text-foreground">{item.name}</p>
                        <StarInput
                          value={itemRatings[key] ?? 0}
                          onChange={(v) => setItemRatings((prev) => ({ ...prev, [key]: v }))}
                          size="sm"
                          clearable
                          label={`Rate ${item.name}`}
                          className="-ml-1"
                        />
                      </div>
                    </motion.li>
                  )
                })}
              </AnimatePresence>
            </ul>
            {remaining > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                fullWidth
                rightIcon={<ChevronDown className="size-4" />}
                onClick={() => setVisibleCount((n) => n + ITEMS_STEP)}
              >
                Load {Math.min(ITEMS_STEP, remaining)} more {remaining === 1 ? 'item' : 'items'}
              </Button>
            )}
          </Card>
        </motion.div>
      )}

      {fieldError('form')}

      {/* Floating submit: always in reach. Neutral until a mobile is entered. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-background via-background/95 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6">
        <div className="pointer-events-auto mx-auto max-w-md">
          <motion.div
            initial={reduce ? false : { y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24, delay: 0.3 }}
          >
            <Button
              type="submit"
              fullWidth
              isLoading={submit.isPending}
              className={cn(
                'shadow-floating transition-colors duration-300',
                !phoneOk && 'bg-surface-muted text-text-secondary shadow-soft hover:bg-surface-muted',
              )}
            >
              {phoneOk ? 'Post review' : 'Enter mobile number to post'}
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.form>
  )
}

function ThankYou({
  slug,
  shopName,
  reviewerName,
  items,
  ratedKeys,
}: {
  slug: string
  shopName: string
  reviewerName: string
  items: ReviewLinkItem[]
  ratedKeys: Record<string, number>
}) {
  const reduce = useReducedMotion()

  // Something to try next: in-stock dishes with a photo, the shop's highlights
  // first, and the ones they just rated last.
  const suggestions = useMemo(
    () =>
      items
        .filter((item) => item.imageUrl && item.inStock)
        .map((item, index) => ({
          item,
          score: (item.highlight ? 0 : 2) + (ratedKeys[itemKey(item)] ? 4 : 0) + index / 1000,
        }))
        .sort((a, b) => a.score - b.score)
        .slice(0, SUGGESTIONS)
        .map(({ item }) => item),
    [items, ratedKeys],
  )

  const shopUrl = ROUTES.businessProfile(slug)

  return (
    <div className="space-y-8 pb-6">
      <Confetti />

      <div className="flex flex-col items-center gap-2 pt-4 text-center">
        <SuccessCheck size={128} />
        <motion.h1
          initial={reduce ? false : { opacity: 0, y: 12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.45, type: 'spring', stiffness: 220, damping: 18 }}
          className="text-title font-bold text-foreground"
        >
          Thank you{reviewerName ? `, ${reviewerName}` : ''}!
        </motion.h1>
        <motion.p
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          className="max-w-xs text-body text-text-secondary"
        >
          Your review for {shopName} is live. To change it later, submit again from the same number.
        </motion.p>
      </div>

      {suggestions.length > 0 && (
        <section className="space-y-3">
          <motion.h2
            initial={reduce ? false : { opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="text-body-lg font-bold text-foreground"
          >
            Try these next at {shopName}
          </motion.h2>
          <motion.div
            className="space-y-4"
            variants={reduce ? undefined : staggerContainer}
            initial="hidden"
            animate="visible"
            transition={{ delayChildren: 0.9, staggerChildren: 0.12 }}
          >
            {suggestions.map((item) => (
              <motion.div key={itemKey(item)} variants={staggerItem}>
                <SuggestionCard item={item} shopUrl={shopUrl} />
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: suggestions.length > 0 ? 1.3 : 0.8 }}
        className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-background via-background/95 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6"
      >
        <div className="mx-auto max-w-md">
          <Button asChild fullWidth className="shadow-floating">
            <Link to={shopUrl}>
              See more on shop
              <ArrowRight className="size-5" aria-hidden />
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

const FOOD_DOT: Record<string, string> = {
  veg: 'border-success text-success',
  non_veg: 'border-destructive text-destructive',
  egg: 'border-warning text-warning',
}

/** A large dish card: whole photo with its colour glow, price, and a way to order it. */
function SuggestionCard({ item, shopUrl }: { item: ReviewLinkItem; shopUrl: string }) {
  // Products deep-link to their row on the shop page (scrolled to + highlighted).
  const orderUrl = item.type === 'product' ? `${shopUrl}?item=${item.id}` : shopUrl

  return (
    <Card className="relative space-y-3 overflow-hidden" padding="md">
      <img
        src={item.imageUrl!}
        alt=""
        aria-hidden
        loading="lazy"
        className="pointer-events-none absolute inset-0 size-full scale-150 object-cover opacity-[0.12] blur-2xl saturate-150"
      />
      <Link to={orderUrl} className="relative block">
        <motion.div whileTap={{ scale: 0.98 }}>
          <DishPhoto src={item.imageUrl!} glow="strong" rounded="rounded-2xl" />
        </motion.div>
        {item.highlight && (
          <span className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-small font-semibold text-white backdrop-blur">
            {item.highlight}
          </span>
        )}
      </Link>
      <div className="relative flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-start gap-1.5">
            {item.foodType && (
              <span
                className={cn('mt-1 grid size-3 shrink-0 place-items-center rounded-[3px] border-2', FOOD_DOT[item.foodType])}
                aria-label={item.foodType.replace('_', '-')}
              >
                <span className="size-1 rounded-full bg-current" />
              </span>
            )}
            <p className="text-body-lg font-bold leading-snug text-foreground">{item.name}</p>
          </div>
          <p className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-body-lg font-bold text-foreground">₹{item.price}</span>
            {item.strikePrice != null && (
              <span className="text-caption text-text-muted line-through">₹{item.strikePrice}</span>
            )}
          </p>
        </div>
        <Button asChild size="md" className="shrink-0">
          <Link to={orderUrl}>
            <ShoppingBag className="size-4" aria-hidden />
            Order
          </Link>
        </Button>
      </div>
    </Card>
  )
}
