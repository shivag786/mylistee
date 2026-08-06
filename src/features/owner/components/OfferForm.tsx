import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSubscription } from '../hooks/useOwner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TextField } from '@/components/forms/TextField'
import { ImageUploadField } from '@/components/forms/ImageUploadField'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { OFFER_TYPE_OPTIONS, defaultOfferDates, offerSchema, type OfferSchema } from '../offerSchema'
import type { Offer, OfferFormValues } from '../types'

/** Add whole days to a yyyy-mm-dd string, returning yyyy-mm-dd. */
function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Prefill values for a brand-new offer (e.g. from a suggestion). */
export type OfferSeed = Partial<Pick<OfferFormValues, 'title' | 'type' | 'rewardValue'>>

interface OfferFormProps {
  offer?: Offer
  /** Prefill a *new* offer without switching to edit mode. */
  seed?: OfferSeed
  onSubmit: (values: OfferFormValues) => Promise<unknown>
  onDone: () => void
  submitting: boolean
}

function initialValues(offer?: Offer, seed?: OfferSeed): OfferSchema {
  const dates = defaultOfferDates()
  return {
    title: offer?.title ?? seed?.title ?? '',
    type: offer?.type ?? seed?.type ?? 'percentage',
    rewardValue: offer?.rewardValue ?? seed?.rewardValue ?? '',
    description: offer?.description ?? '',
    startsAt: offer?.startsAt ?? dates.startsAt,
    endsAt: offer?.endsAt ?? dates.endsAt,
    totalQuantity: offer?.totalQuantity != null ? String(offer.totalQuantity) : '',
  }
}

/** Create/edit form shared by the "New offer" and "Edit offer" sheets. */
export function OfferForm({ offer, seed, onSubmit, onDone, submitting }: OfferFormProps) {
  const [image, setImage] = useState<File | null>(null)
  const form = useForm<OfferSchema>({
    resolver: zodResolver(offerSchema),
    defaultValues: initialValues(offer, seed),
    mode: 'onTouched',
  })

  // The plan caps how long an offer can run. When there's a cap, the end date is
  // derived (start + cap days) and locked — the owner only picks the start. A
  // null cap (Pro/Enterprise) leaves the end date freely editable.
  const { data: sub } = useSubscription()
  const maxDays = sub?.plan?.limits.maxOfferDays ?? null
  const capped = typeof maxDays === 'number'
  const startsAt = form.watch('startsAt')

  useEffect(() => {
    if (typeof maxDays === 'number' && startsAt) {
      form.setValue('endsAt', addDays(startsAt, maxDays), { shouldValidate: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startsAt, maxDays])

  async function submit(values: OfferSchema) {
    try {
      await onSubmit({ ...values, image })
      toast.success(offer ? 'Offer updated' : 'Offer created')
      onDone()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not save the offer.')
    }
  }

  const type = form.watch('type')

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
      <TextField
        label="Offer title"
        placeholder="e.g. 20% off your bill"
        error={form.formState.errors.title?.message}
        {...form.register('title')}
      />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="offer-type">Offer type</Label>
        <Select value={type} onValueChange={(v) => form.setValue('type', v as OfferSchema['type'])}>
          <SelectTrigger id="offer-type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OFFER_TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <TextField
        label="Reward value"
        placeholder="e.g. 20%, ₹50 off, 1 Free Coffee"
        hint="Shown on the spinner and in the customer's wallet."
        error={form.formState.errors.rewardValue?.message}
        {...form.register('rewardValue')}
      />

      <div className="grid grid-cols-2 gap-3">
        <TextField label="Starts" type="date" error={form.formState.errors.startsAt?.message} {...form.register('startsAt')} />
        <TextField
          label="Ends"
          type="date"
          readOnly={capped}
          hint={
            capped
              ? `Auto: ${maxDays} day${maxDays === 1 ? '' : 's'} after the start (${sub?.plan?.name ?? 'your'} plan)`
              : 'Pick any end date'
          }
          error={form.formState.errors.endsAt?.message}
          {...form.register('endsAt')}
        />
      </div>

      <TextField
        label="Total quantity (optional)"
        type="number"
        inputMode="numeric"
        placeholder="Leave blank for unlimited"
        error={form.formState.errors.totalQuantity?.message}
        {...form.register('totalQuantity')}
      />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="offer-desc">Description (optional)</Label>
        <textarea
          id="offer-desc"
          rows={3}
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-body text-foreground outline-none transition-colors placeholder:text-text-muted focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
          {...form.register('description')}
        />
      </div>

      <ImageUploadField label="Offer image (optional)" aspect="cover" value={image} previewUrl={offer?.imageUrl} onChange={setImage} />

      <Button type="submit" fullWidth isLoading={submitting}>
        {offer ? 'Save changes' : 'Create offer'}
      </Button>
    </form>
  )
}
