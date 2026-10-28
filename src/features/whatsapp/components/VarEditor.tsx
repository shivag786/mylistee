import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { TemplateVar, WaSource } from '../types'

interface VarEditorProps {
  /** e.g. "{{2}}" or "Header" — what this blank is. */
  name: string
  value: TemplateVar
  onChange: (next: TemplateVar) => void
  sources: WaSource[]
  /** Which source groups fit here: text blanks never take an image, etc. */
  kinds?: string[]
  /** Ask for a sample value (when creating — Meta reviews with it). */
  withSample?: boolean
}

/**
 * One {{n}} blank: where its value comes from — the customer's name, the shop,
 * the order, the OTP — or typed by the shop owner (with the label they see),
 * or fixed text set here.
 */
export function VarEditor({ name, value, onChange, sources, kinds = ['all', 'order', 'otp', 'shop'], withSample }: VarEditorProps) {
  const options = sources.filter((s) => kinds.includes(s.for))
  const source = options.find((s) => s.key === value.source)

  return (
    <div className="grid gap-2 rounded-xl border border-border bg-surface-muted/40 p-2.5 sm:grid-cols-[3.5rem_1fr]">
      <span className="self-center font-mono text-caption font-semibold text-text-secondary">{name}</span>
      <div className="space-y-2">
        <Select value={value.source} onValueChange={(v) => onChange({ ...value, source: v })}>
          <SelectTrigger className="h-9" aria-label={`How ${name} is filled`}>
            <SelectValue placeholder="Pick what goes here" />
          </SelectTrigger>
          <SelectContent>
            {options.map((s) => (
              <SelectItem key={s.key} value={s.key}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {value.source === 'custom' && (
          <Input
            className="h-9"
            value={value.label ?? ''}
            maxLength={40}
            onChange={(e) => onChange({ ...value, label: e.target.value })}
            placeholder="What the shop types, e.g. Offer"
            aria-label={`Label for ${name}`}
          />
        )}
        {value.source === 'fixed' && (
          <Input
            className="h-9"
            value={value.value ?? ''}
            maxLength={500}
            onChange={(e) => onChange({ ...value, value: e.target.value })}
            placeholder="The text to put here"
            aria-label={`Text for ${name}`}
          />
        )}
        {withSample && (value.source === 'custom' || (value.source !== 'fixed' && !source?.sample)) && (
          <Input
            className="h-9"
            value={value.sample ?? ''}
            maxLength={120}
            onChange={(e) => onChange({ ...value, sample: e.target.value })}
            placeholder="Example for WhatsApp review, e.g. 20% off"
            aria-label={`Example for ${name}`}
          />
        )}
      </div>
    </div>
  )
}

