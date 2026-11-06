import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { DurationUnit } from '@/features/admin/planDuration'
import { BILLING_OPTIONS } from '@/features/owner/planDisplay'

/** How long a plan lasts: a number with a Days / Months picker. */
export function DurationInput({
  label,
  value,
  unit,
  onChange,
  onUnitChange,
  placeholder,
}: {
  label: string
  value: string
  unit: DurationUnit
  onChange: (v: string) => void
  onUnitChange: (u: DurationUnit) => void
  placeholder?: string
}) {
  return (
    <div className="space-y-1">
      <Label className="text-small">{label}</Label>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
          inputMode="numeric"
          placeholder={placeholder}
          aria-label={label}
          className="h-11 min-w-0 flex-1"
        />
        <Select value={unit} onValueChange={(v) => onUnitChange(v as DurationUnit)}>
          <SelectTrigger className="h-11 w-32 shrink-0" aria-label={`${label} in`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="days">Days</SelectItem>
            <SelectItem value="months">Months</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

/** A paid plan's billing: Monthly, Quarterly or Yearly — one payment lasts that long. */
export function BillingSelect({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-small">
        Billing
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="h-11 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {BILLING_OPTIONS.map((b) => (
            <SelectItem key={b.value} value={b.value}>
              {b.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
