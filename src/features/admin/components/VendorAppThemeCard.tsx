import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { RotateCcw, Smartphone } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/feedback/Spinner'
import { apiClient } from '@/services/apiClient'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'

/** The Listee Business phone app's look, as GET/PUT /admin/vendor-app-theme speak it. */
interface VendorAppTheme {
  primary: string
  onPrimary: string
  secondary: string
  accent: string
  background: string
  surface: string
  ink: string
  splashSeconds: number
}

interface ThemeResponse {
  theme: VendorAppTheme
  defaults: VendorAppTheme
}

const KEY = ['admin', 'vendor-app-theme'] as const

const FIELDS: { key: keyof Omit<VendorAppTheme, 'splashSeconds'>; label: string; hint: string }[] = [
  { key: 'primary', label: 'Primary', hint: 'Main buttons, highlights' },
  { key: 'onPrimary', label: 'Text on primary', hint: 'Button text' },
  { key: 'secondary', label: 'Secondary', hint: 'Active tab, links' },
  { key: 'accent', label: 'Alert', hint: 'New orders, badges' },
  { key: 'background', label: 'Background', hint: 'Screens' },
  { key: 'surface', label: 'Cards', hint: 'Cards, sheets' },
  { key: 'ink', label: 'Text', hint: 'Headings, body' },
]

const HEX = /^#[0-9A-Fa-f]{6}$/

/**
 * Admin → Business app: colours and splash time of the vendor phone app. The
 * app picks them up from GET /config on its next launch. Separate from the
 * website theme, so the business app can keep its own brand look.
 */
export function VendorAppThemeCard() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: KEY,
    queryFn: () => apiClient.get<ThemeResponse>('admin/vendor-app-theme'),
  })
  const [draft, setDraft] = useState<VendorAppTheme | null>(null)

  useEffect(() => {
    if (data) setDraft(data.theme)
  }, [data])

  const onDone = (message: string) => ({
    onSuccess: (res: ThemeResponse) => {
      qc.setQueryData(KEY, res)
      toast.success(message, 'Owners see it the next time they open the app.')
    },
    onError: (err: unknown) => toast.error(err instanceof ApiError ? err.message : 'Could not save the app theme.'),
  })

  const save = useMutation({ mutationFn: (t: VendorAppTheme) => apiClient.put<ThemeResponse>('admin/vendor-app-theme', t) })
  const reset = useMutation({ mutationFn: () => apiClient.delete<ThemeResponse>('admin/vendor-app-theme') })

  if (isLoading || !draft) {
    return (
      <Card elevation="soft" className="flex max-w-xl justify-center" padding="lg">
        <Spinner size={24} label="Loading business app theme" />
      </Card>
    )
  }

  const valid = FIELDS.every((f) => HEX.test(draft[f.key]))

  return (
    <Card elevation="soft" className="max-w-xl space-y-5" padding="lg">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl" style={{ background: draft.primary, color: draft.onPrimary }}>
          <Smartphone className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-body-lg font-bold text-foreground">Business app theme</h2>
          <p className="text-caption text-text-secondary">
            Colours of the Listee Business phone app for shop owners. Separate from the website theme.
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
        <div className="grid grid-cols-2 gap-3">
          {FIELDS.map((f) => (
            <div key={f.key} className="space-y-1">
              <Label htmlFor={`va-${f.key}`}>{f.label}</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  aria-label={`${f.label} colour`}
                  value={HEX.test(draft[f.key]) ? draft[f.key] : '#000000'}
                  onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value.toUpperCase() })}
                  className="size-10 shrink-0 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
                />
                <Input
                  id={`va-${f.key}`}
                  value={draft[f.key]}
                  onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value.toUpperCase().slice(0, 7) })}
                  aria-invalid={!HEX.test(draft[f.key])}
                  className="h-10 font-mono text-caption"
                />
              </div>
              <p className="text-[11px] text-text-muted">{f.hint}</p>
            </div>
          ))}
          <div className="space-y-1">
            <Label htmlFor="va-splash">Splash screen (seconds)</Label>
            <Input
              id="va-splash"
              type="number"
              min={1}
              max={6}
              value={draft.splashSeconds}
              onChange={(e) => setDraft({ ...draft, splashSeconds: Math.max(1, Math.min(6, Number(e.target.value) || 3)) })}
              className="h-10"
            />
          </div>
        </div>

        <PhonePreview theme={draft} />
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="ghost"
          leftIcon={<RotateCcw className="size-4" />}
          isLoading={reset.isPending}
          onClick={() => reset.mutate(undefined, onDone('Back to the Listee Business look'))}
        >
          Reset to brand
        </Button>
        <Button disabled={!valid} isLoading={save.isPending} onClick={() => save.mutate(draft, onDone('Business app theme saved'))}>
          Save app theme
        </Button>
      </div>
    </Card>
  )
}

/** A small phone showing the order screen in the chosen colours. */
function PhonePreview({ theme: t }: { theme: VendorAppTheme }) {
  return (
    <motion.div
      layout
      className="mx-auto w-[150px] overflow-hidden rounded-[26px] border-[5px] border-[#16232A] shadow-lg"
      style={{ background: t.background }}
      aria-label="Preview"
    >
      <div className="px-2.5 pb-2 pt-3" style={{ color: t.ink }}>
        <p className="text-[11px] font-extrabold">Orders</p>
        <motion.div
          className="mt-2 rounded-xl p-2 shadow-sm"
          style={{ background: t.surface, borderLeft: `3px solid ${t.accent}` }}
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold">#A12</span>
            <span className="rounded-full px-1.5 text-[8px] font-bold text-white" style={{ background: t.accent }}>
              NEW
            </span>
          </div>
          <p className="text-[8px] opacity-70">2 items · ₹240</p>
          <div className="mt-1.5 rounded-lg py-1 text-center text-[9px] font-bold" style={{ background: t.primary, color: t.onPrimary }}>
            Accept
          </div>
        </motion.div>
        <div className="mt-1.5 rounded-xl p-2" style={{ background: t.surface }}>
          <div className="h-1.5 w-2/3 rounded" style={{ background: t.ink, opacity: 0.15 }} />
          <div className="mt-1 h-1.5 w-1/3 rounded" style={{ background: t.ink, opacity: 0.1 }} />
        </div>
      </div>
      <div className="flex justify-around py-1.5" style={{ background: t.surface }}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="size-2.5 rounded-full" style={{ background: i === 0 ? t.secondary : t.ink, opacity: i === 0 ? 1 : 0.2 }} />
        ))}
      </div>
    </motion.div>
  )
}
