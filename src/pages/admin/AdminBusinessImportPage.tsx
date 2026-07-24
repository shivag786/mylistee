import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Download,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  RotateCcw,
  ExternalLink,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { MESSAGES } from '@/constants/messages'
import { ImportLoadingSteps } from '@/features/admin/components/import/ImportLoadingSteps'
import { ImportPreviewCard } from '@/features/admin/components/import/ImportPreviewCard'
import {
  ImportFieldComparison,
  type ComparableField,
  type FieldChoice,
} from '@/features/admin/components/import/ImportFieldComparison'
import { useImportApply, useImportLogs, useImportPreview } from '@/features/admin/hooks/useAdmin'
import type {
  AdminBusiness,
  ImportApplyFields,
  ImportPreview,
  ImportPreviewResult,
} from '@/features/admin/types'

type Phase = 'input' | 'loading' | 'preview' | 'done'

const COMPARABLE: ComparableField[] = ['name', 'phone', 'website', 'address', 'category']

function initChoices(existing: AdminBusiness): Record<ComparableField, FieldChoice> {
  return COMPARABLE.reduce(
    (acc, key) => {
      // Default to keeping the owner's value when it exists (never overwrite silently).
      acc[key] = existing[key]?.toString().trim() ? 'existing' : 'imported'
      return acc
    },
    {} as Record<ComparableField, FieldChoice>,
  )
}

/** Google-only metadata — new columns, safe to always fill (not owner-editable). */
function googleFields(p: ImportPreview): ImportApplyFields {
  return {
    rating: p.rating,
    reviewCount: p.reviewCount,
    primaryImageUrl: p.primaryImageUrl,
    secondaryImageUrl: p.secondaryImageUrl,
    businessStatus: p.businessStatus,
  }
}

/**
 * SPEC-011 — Business Import Engine (admin only). A single URL box → animated
 * progress → preview → (optional) duplicate comparison → confirm. No data is
 * saved until the admin clicks Import.
 */
export function AdminBusinessImportPage() {
  const [phase, setPhase] = useState<Phase>('input')
  const [url, setUrl] = useState('')
  const [result, setResult] = useState<ImportPreviewResult | null>(null)
  const [choices, setChoices] = useState<Record<ComparableField, FieldChoice>>(
    {} as Record<ComparableField, FieldChoice>,
  )
  const [outcome, setOutcome] = useState<{ mode: string; count: number; business: AdminBusiness | null } | null>(null)

  const preview = useImportPreview()
  const apply = useImportApply()
  const logs = useImportLogs({ perPage: 5 })

  const duplicate = result?.duplicate ?? null

  function reset() {
    setPhase('input')
    setUrl('')
    setResult(null)
    setOutcome(null)
  }

  async function handlePreview(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) {
      toast.error('Please paste a Google Business Profile URL.')
      return
    }
    setPhase('loading')
    try {
      const res = await preview.mutateAsync(url.trim())
      setResult(res)
      if (res.duplicate) setChoices(initChoices(res.duplicate))
      setPhase('preview')
    } catch (err) {
      setPhase('input')
      toast.error(err instanceof ApiError ? err.message : MESSAGES.errors.generic)
    }
  }

  /** Build the confirmed field payload for the chosen mode. */
  function buildFields(mode: 'create' | 'update', p: ImportPreview): ImportApplyFields {
    if (mode === 'create') {
      return {
        name: p.name,
        phone: p.phone,
        website: p.website,
        address: p.address,
        category: p.category,
        latitude: p.latitude,
        longitude: p.longitude,
        ...googleFields(p),
      }
    }
    // update: only apply owner-editable fields the admin explicitly chose.
    const fields: ImportApplyFields = { ...googleFields(p) }
    for (const key of COMPARABLE) {
      if (choices[key] === 'imported') fields[key] = p[key] as never
    }
    return fields
  }

  async function handleImport(mode: 'create' | 'update' | 'ignore') {
    if (!result) return
    const p = result.preview
    try {
      const res = await apply.mutateAsync({
        url: p.sourceUrl || url.trim(),
        placeId: p.placeId,
        mode,
        businessId: duplicate?.id ?? null,
        fields: mode === 'ignore' ? {} : buildFields(mode, p),
      })
      if (mode === 'ignore') {
        toast.info('Import ignored. Nothing was changed.')
        reset()
        return
      }
      setOutcome({ mode: res?.mode ?? mode, count: res?.updatedCount ?? 0, business: res?.business ?? null })
      setPhase('done')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : MESSAGES.errors.generic)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-title font-bold text-foreground">
          <Download className="size-6 text-primary" aria-hidden /> Business Import
        </h1>
        <p className="text-caption text-text-secondary">
          Paste a Google Business Profile link to fill in a listing in seconds.
        </p>
      </header>

      <AnimatePresence mode="wait">
        {/* ---- URL input ---- */}
        {phase === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <Card className="space-y-4" padding="lg">
              <form onSubmit={handlePreview} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="google-url">Google Business Profile URL</Label>
                  <Input
                    id="google-url"
                    inputMode="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://maps.google.com/…"
                    className="h-13 text-body"
                    autoFocus
                  />
                </div>
                <Button type="submit" size="lg" fullWidth leftIcon={<Sparkles className="size-5" />}>
                  Import Details
                </Button>
              </form>
            </Card>
          </motion.div>
        )}

        {/* ---- Loading animation ---- */}
        {phase === 'loading' && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card className="py-10" padding="lg">
              <ImportLoadingSteps done={!preview.isPending} />
            </Card>
          </motion.div>
        )}

        {/* ---- Preview (+ duplicate comparison) ---- */}
        {phase === 'preview' && result && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            {duplicate && (
              <Card className="border-warning/40 bg-warning/5" padding="md">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
                  <div className="space-y-1">
                    <p className="text-body font-semibold text-foreground">Business already exists</p>
                    <p className="text-caption text-text-secondary">
                      This matches <span className="font-medium text-foreground">{duplicate.name}</span>. Choose which
                      details to keep below, then update it — or ignore this import.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            <ImportPreviewCard preview={result.preview} />

            {duplicate && (
              <Card padding="md" className="space-y-3">
                <h3 className="text-subtitle font-semibold text-foreground">Review changes</h3>
                <ImportFieldComparison
                  existing={duplicate}
                  preview={result.preview}
                  choices={choices}
                  onChange={(field, choice) => setChoices((c) => ({ ...c, [field]: choice }))}
                />
              </Card>
            )}

            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="ghost" onClick={reset} disabled={apply.isPending} leftIcon={<ArrowLeft className="size-4" />}>
                Cancel
              </Button>
              {duplicate ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => void handleImport('ignore')}
                    disabled={apply.isPending}
                  >
                    Ignore
                  </Button>
                  <Button onClick={() => void handleImport('update')} isLoading={apply.isPending}>
                    Update existing
                  </Button>
                </>
              ) : (
                <Button onClick={() => void handleImport('create')} isLoading={apply.isPending} leftIcon={<Download className="size-4" />}>
                  Import
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {/* ---- Success ---- */}
        {phase === 'done' && outcome && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="space-y-4 text-center" padding="lg">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/10"
              >
                <CheckCircle2 className="size-8 text-success" aria-hidden />
              </motion.div>
              <div className="space-y-1">
                <h2 className="text-subtitle font-semibold text-foreground">Business imported successfully</h2>
                <p className="text-caption text-text-secondary">
                  {outcome.count} field(s) {outcome.mode === 'created' ? 'imported' : 'updated'} · Images linked · Ready
                  for review.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="outline" onClick={reset} leftIcon={<RotateCcw className="size-4" />}>
                  Import another
                </Button>
                {outcome.business && (
                  <Badge tone="success" className="self-center">
                    {outcome.mode === 'created' ? 'New listing' : 'Updated'}: {outcome.business.name}
                  </Badge>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Recent imports (SPEC-011 §ADMIN LOG) ---- */}
      {phase === 'input' && (logs.data?.items.length ?? 0) > 0 && (
        <Card padding="md" className="space-y-2">
          <h3 className="text-caption font-semibold text-text-muted">Recent imports</h3>
          <ul className="divide-y divide-border">
            {logs.data!.items.map((log) => (
              <li key={log.id} className="flex items-center justify-between gap-3 py-2 text-caption">
                <span className="min-w-0 truncate text-foreground">
                  {log.businessName ?? log.sourceUrl ?? 'Import'}
                </span>
                <span className="flex shrink-0 items-center gap-2 text-text-muted">
                  <Badge tone={log.status === 'failed' ? 'danger' : 'info'} size="sm">
                    {log.status}
                  </Badge>
                  {log.sourceUrl && (
                    <a href={log.sourceUrl} target="_blank" rel="noreferrer" className="text-primary">
                      <ExternalLink className="size-3.5" aria-hidden />
                    </a>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

export default AdminBusinessImportPage
