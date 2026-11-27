import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Camera, FileText, ImagePlus, Plus, ScanLine, Sparkles, Trash2, X } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { cn } from '@/utils/cn'
import { productKeys } from '../hooks/useProducts'
import { menuScanService, type ScannedItem } from '../services/menuScanService'
import type { FoodType } from '../productTypes'

/** A row on the review screen: the scanned dish plus a local id and a tick. */
interface Row extends ScannedItem {
  key: string
  include: boolean
}

const FOOD: { value: FoodType | null; label: string; className: string }[] = [
  { value: 'veg', label: 'Veg', className: 'border-success text-success' },
  { value: 'non_veg', label: 'Non-veg', className: 'border-destructive text-destructive' },
  { value: 'egg', label: 'Egg', className: 'border-warning text-warning' },
  { value: null, label: '—', className: 'border-border text-text-muted' },
]

const SCAN_MESSAGES = ['Reading your menu…', 'Finding dishes and prices…', 'Sorting into sections…', 'Almost done…']

let seq = 0
const newKey = () => `r${++seq}`

/**
 * "Scan menu": the owner takes photos of the printed menu (or uploads photos,
 * screenshots or a PDF), the AI reads the dishes, and the owner checks and
 * edits the list before adding it. Nothing is saved until "Add dishes".
 */
export function MenuScanSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const qc = useQueryClient()
  const [files, setFiles] = useState<File[]>([])
  const [rows, setRows] = useState<Row[] | null>(null)
  const [skipExisting, setSkipExisting] = useState(true)
  const [msg, setMsg] = useState(0)
  const cameraRef = useRef<HTMLInputElement>(null)
  const uploadRef = useRef<HTMLInputElement>(null)

  const status = useQuery({ queryKey: ['owner', 'menu-scan'], queryFn: menuScanService.status, enabled: open })
  const maxFiles = status.data?.maxFiles ?? 6
  const left = status.data ? Math.max(0, status.data.limit - status.data.used) : null

  const scan = useMutation({
    mutationFn: () => menuScanService.scan(files),
    onSuccess: (res) => {
      setRows(res.items.map((item) => ({ ...item, key: newKey(), include: true })))
      void qc.invalidateQueries({ queryKey: ['owner', 'menu-scan'] })
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Could not read the menu. Please try again.'),
  })

  const save = useMutation({
    mutationFn: (items: Row[]) =>
      menuScanService.importItems(
        items.map(({ name, category, price, description, foodType, variants }) => ({
          name: name.trim(),
          category: category?.trim() || null,
          price,
          description: description?.trim() || null,
          foodType,
          variants: variants.filter((v) => v.name.trim() && Number.isFinite(v.price)),
        })),
        skipExisting,
      ),
    onSuccess: async (res) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: productKeys.products }),
        qc.invalidateQueries({ queryKey: productKeys.categories }),
      ])
      // Name the dishes, so a missing one is never a mystery.
      const list = (names: string[]) => (names.length > 4 ? `${names.slice(0, 4).join(', ')} +${names.length - 4} more` : names.join(', '))
      const skippedNames = res.skippedNames ?? []
      const extra = [
        res.skipped ? `${res.skipped} already on your menu (same name and section) were skipped${skippedNames.length ? `: ${list(skippedNames)}` : ''}.` : '',
        res.limitReached ? 'Your plan’s product limit was reached — upgrade to add the rest.' : '',
        res.failed.length ? `${res.failed.length} not saved: ${list(res.failed.map((f) => `${f.name} (${f.reason})`))}.` : '',
      ]
        .filter(Boolean)
        .join(' ')
      if (res.created > 0) toast.success(`${res.created} dishes added to your menu`, extra || undefined)
      else toast.info('No new dishes were added', extra || undefined)
      if (res.created > 0) close()
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Could not add the dishes. Please try again.'),
  })

  // Rotate the waiting message while the AI reads.
  useEffect(() => {
    if (!scan.isPending) return
    setMsg(0)
    const id = window.setInterval(() => setMsg((m) => Math.min(m + 1, SCAN_MESSAGES.length - 1)), 4000)
    return () => window.clearInterval(id)
  }, [scan.isPending])

  const previews = useMemo(() => files.map((f) => (f.type.startsWith('image/') ? URL.createObjectURL(f) : null)), [files])
  useEffect(() => () => previews.forEach((u) => u && URL.revokeObjectURL(u)), [previews])

  function close() {
    onOpenChange(false)
    setFiles([])
    setRows(null)
    scan.reset()
    save.reset()
  }

  function addFiles(list: FileList | null) {
    if (!list) return
    const next = [...files, ...Array.from(list)].slice(0, maxFiles)
    if (files.length + list.length > maxFiles) toast.info(`Up to ${maxFiles} pages at a time`)
    setFiles(next)
  }

  const patch = (key: string, change: Partial<Row>) =>
    setRows((rs) => rs?.map((r) => (r.key === key ? { ...r, ...change } : r)) ?? null)

  const chosen = (rows ?? []).filter((r) => r.include && r.name.trim() && !(skipExisting && r.exists))
  const missingPrice = chosen.filter((r) => r.price === null && r.variants.length === 0).length
  const sections = new Set((rows ?? []).map((r) => r.category?.trim() || 'Other')).size

  return (
    <Sheet open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-3xl">
        <SheetHeader className="border-b border-border/60 p-5">
          <SheetTitle className="flex items-center gap-2">
            <ScanLine className="size-5 text-primary" aria-hidden /> Scan your menu with AI
          </SheetTitle>
          <SheetDescription>
            {rows
              ? 'Check the dishes, fix anything that is wrong, then add them. Nothing is saved until you tap Add.'
              : 'Take clear photos of your printed menu, or upload photos, screenshots or a PDF. The AI reads the dishes, sections, prices and sizes for you.'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-5">
          {status.data && !status.data.available ? (
            <p className="rounded-xl bg-surface-muted p-4 text-caption text-text-secondary">
              Menu scan is switched off right now. Add products one by one, or try again later.
            </p>
          ) : scan.isPending ? (
            <div className="flex min-h-[40dvh] flex-col items-center justify-center gap-4 text-center">
              <span className="relative grid size-20 place-items-center rounded-3xl bg-primary-soft text-primary">
                <Sparkles className="size-9 animate-pulse" aria-hidden />
              </span>
              <p className="text-body font-semibold text-foreground" aria-live="polite">
                {SCAN_MESSAGES[msg]}
              </p>
              <p className="max-w-xs text-caption text-text-secondary">This takes 5–30 seconds, depending on the number of pages.</p>
            </div>
          ) : rows ? (
            <ReviewList
              rows={rows}
              skipExisting={skipExisting}
              onSkipExisting={setSkipExisting}
              onPatch={patch}
              onRemove={(key) => setRows((rs) => rs?.filter((r) => r.key !== key) ?? null)}
              onAdd={() =>
                setRows((rs) => [
                  ...(rs ?? []),
                  { key: newKey(), include: true, exists: false, name: '', category: rs?.at(-1)?.category ?? null, price: null, description: null, foodType: null, variants: [] },
                ])
              }
              sections={sections}
            />
          ) : (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => cameraRef.current?.click()}
                  className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 bg-primary-soft/40 p-6 text-center hover:border-primary"
                >
                  <Camera className="size-8 text-primary" aria-hidden />
                  <span className="text-body font-bold text-foreground">Take a photo</span>
                  <span className="text-small text-text-secondary">Opens the camera on your phone</span>
                </button>
                <button
                  type="button"
                  onClick={() => uploadRef.current?.click()}
                  className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border p-6 text-center hover:border-primary"
                >
                  <ImagePlus className="size-8 text-primary" aria-hidden />
                  <span className="text-body font-bold text-foreground">Upload photos or PDF</span>
                  <span className="text-small text-text-secondary">Up to {maxFiles} pages · JPG, PNG, PDF</span>
                </button>
              </div>
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} />
              <input ref={uploadRef} type="file" accept="image/*,application/pdf" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} />

              {files.length > 0 && (
                <div>
                  <p className="mb-2 text-caption font-semibold text-foreground">
                    {files.length} {files.length === 1 ? 'page' : 'pages'} ready
                  </p>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                    {files.map((f, i) => (
                      <div key={`${f.name}-${i}`} className="relative aspect-[3/4] overflow-hidden rounded-xl border border-border bg-surface-muted">
                        {previews[i] ? (
                          <img src={previews[i] ?? ''} alt={`Menu page ${i + 1}`} className="size-full object-cover" />
                        ) : (
                          <span className="grid size-full place-items-center p-2 text-center text-small text-text-secondary">
                            <FileText className="mx-auto size-6" aria-hidden />
                            {f.name}
                          </span>
                        )}
                        <button
                          type="button"
                          aria-label={`Remove page ${i + 1}`}
                          onClick={() => setFiles((fs) => fs.filter((_, j) => j !== i))}
                          className="absolute right-1 top-1 grid size-7 place-items-center rounded-full bg-black/60 text-white"
                        >
                          <X className="size-4" aria-hidden />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <ul className="space-y-1.5 rounded-xl bg-surface-muted p-4 text-small text-text-secondary">
                <li>• Keep the menu flat, in good light, and fill the photo with it.</li>
                <li>• One photo per page. Long menus: send all pages together.</li>
                <li>• Your Zomato / Swiggy menu? Take screenshots of it and upload them here.</li>
                {left !== null && <li>• {left} scans left this month.</li>}
              </ul>
            </div>
          )}
        </div>

        <SheetFooter className="flex-row items-center justify-between gap-3 border-t border-border/60 p-4">
          {rows ? (
            <>
              <Button variant="ghost" size="md" onClick={() => setRows(null)} disabled={save.isPending}>
                Scan again
              </Button>
              <div className="flex items-center gap-3">
                {missingPrice > 0 && <span className="hidden text-small text-warning sm:inline">{missingPrice} without a price</span>}
                <Button size="md" isLoading={save.isPending} disabled={chosen.length === 0} onClick={() => save.mutate(chosen)}>
                  Add {chosen.length} {chosen.length === 1 ? 'dish' : 'dishes'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button variant="ghost" size="md" onClick={close}>
                Cancel
              </Button>
              <Button
                size="md"
                leftIcon={<Sparkles className="size-5" />}
                isLoading={scan.isPending}
                disabled={files.length === 0 || status.data?.available === false || left === 0}
                onClick={() => scan.mutate()}
              >
                Read menu with AI
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function ReviewList({
  rows,
  sections,
  skipExisting,
  onSkipExisting,
  onPatch,
  onRemove,
  onAdd,
}: {
  rows: Row[]
  sections: number
  skipExisting: boolean
  onSkipExisting: (v: boolean) => void
  onPatch: (key: string, change: Partial<Row>) => void
  onRemove: (key: string) => void
  onAdd: () => void
}) {
  const existing = rows.filter((r) => r.exists).length
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-success/10 px-4 py-3">
        <p className="text-caption font-semibold text-foreground">
          {rows.length} dishes found in {sections} {sections === 1 ? 'section' : 'sections'}
        </p>
        {existing > 0 && (
          <label className="flex items-center gap-2 text-small text-text-secondary">
            <Checkbox checked={skipExisting} onCheckedChange={(v) => onSkipExisting(v === true)} />
            Skip {existing} already on my menu
          </label>
        )}
      </div>

      <ul className="space-y-3">
        {rows.map((r) => {
          const dimmed = !r.include || (skipExisting && r.exists)
          return (
            <li key={r.key} className={cn('rounded-2xl border border-border bg-surface p-3', dimmed && 'opacity-50')}>
              <div className="flex items-start gap-2">
                <Checkbox
                  className="mt-2.5"
                  checked={r.include}
                  onCheckedChange={(v) => onPatch(r.key, { include: v === true })}
                  aria-label={`Add ${r.name || 'this dish'}`}
                />
                <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[1.6fr_1fr_6rem]">
                  <Input
                    className="h-10 px-3 text-caption font-semibold"
                    value={r.name}
                    placeholder="Dish name"
                    aria-label="Dish name"
                    onChange={(e) => onPatch(r.key, { name: e.target.value })}
                  />
                  <Input
                    className="h-10 px-3 text-caption"
                    value={r.category ?? ''}
                    placeholder="Section"
                    aria-label="Menu section"
                    onChange={(e) => onPatch(r.key, { category: e.target.value || null })}
                  />
                  <Input
                    className={cn('h-10 px-3 text-caption', r.price === null && r.variants.length === 0 && 'border-warning')}
                    inputMode="decimal"
                    value={r.price ?? ''}
                    placeholder="₹ Price"
                    aria-label="Price"
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^\d.]/g, '')
                      onPatch(r.key, { price: v === '' ? null : Number(v) })
                    }}
                  />
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${r.name || 'this dish'}`}
                  onClick={() => onRemove(r.key)}
                  className="mt-1 grid size-9 shrink-0 place-items-center rounded-full text-text-muted hover:bg-surface-muted hover:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-7">
                {FOOD.map((f) => (
                  <button
                    key={f.label}
                    type="button"
                    onClick={() => onPatch(r.key, { foodType: f.value })}
                    className={cn(
                      'rounded-full border px-2.5 py-0.5 text-small font-semibold',
                      r.foodType === f.value ? f.className + ' bg-surface-muted' : 'border-transparent text-text-muted',
                    )}
                  >
                    {f.label}
                  </button>
                ))}
                {r.exists && <span className="ml-1 rounded-full bg-surface-muted px-2 py-0.5 text-small text-text-secondary">Already on menu</span>}
                {r.variants.map((v, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-small text-primary">
                    <input
                      className="w-14 bg-transparent font-semibold outline-none"
                      value={v.name}
                      aria-label="Size name"
                      onChange={(e) => onPatch(r.key, { variants: r.variants.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })}
                    />
                    ₹
                    <input
                      className="w-12 bg-transparent outline-none"
                      inputMode="decimal"
                      value={v.price}
                      aria-label="Size price"
                      onChange={(e) =>
                        onPatch(r.key, {
                          variants: r.variants.map((x, j) => (j === i ? { ...x, price: Number(e.target.value.replace(/[^\d.]/g, '')) || 0 } : x)),
                        })
                      }
                    />
                    <button
                      type="button"
                      aria-label="Remove size"
                      onClick={() => onPatch(r.key, { variants: r.variants.filter((_, j) => j !== i) })}
                    >
                      <X className="size-3" aria-hidden />
                    </button>
                  </span>
                ))}
              </div>
              {r.description && <p className="mt-1.5 pl-7 text-small text-text-secondary">{r.description}</p>}
            </li>
          )
        })}
      </ul>

      <Button variant="outline" size="sm" leftIcon={<Plus className="size-4" />} onClick={onAdd}>
        Add a dish the AI missed
      </Button>
    </div>
  )
}
