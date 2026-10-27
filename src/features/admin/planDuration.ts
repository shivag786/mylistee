export type DurationUnit = 'days' | 'months'

/** The plan length as the API takes it: one of days / months, the other cleared. */
export function durationPayload(value: string, unit: DurationUnit): { durationDays: number | null; durationMonths: number | null } {
  const n = value === '' ? null : Math.max(1, Math.round(Number(value)))
  return unit === 'months' ? { durationDays: null, durationMonths: n } : { durationDays: n, durationMonths: null }
}
