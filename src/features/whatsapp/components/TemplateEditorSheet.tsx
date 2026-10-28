import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Trash2, Braces, Send } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiClient } from '@/services/apiClient'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { WhatsAppPreview } from './WhatsAppPreview'
import { VarEditor } from './VarEditor'
import { countBlanks, sampleFor, type TemplateButton, type TemplateVar, type WaAdminState, type WaPreset, type WaTemplate } from '../types'

interface TemplateEditorSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  state: WaAdminState
  /** Start from a ready-made template. */
  preset?: WaPreset | null
  onCreated: (t: WaTemplate) => void
}

interface Draft {
  name: string
  displayName: string
  category: 'MARKETING' | 'UTILITY'
  language: string
  headerFormat: 'NONE' | 'TEXT' | 'IMAGE'
  header: string
  headerVar: TemplateVar
  body: string
  bodyVars: TemplateVar[]
  footer: string
  buttons: TemplateButton[]
  forShops: boolean
}

const EMPTY: Draft = {
  name: '',
  displayName: '',
  category: 'MARKETING',
  language: 'en',
  headerFormat: 'NONE',
  header: '',
  headerVar: { source: 'shop_name' },
  body: '',
  bodyVars: [],
  footer: '',
  buttons: [],
  forShops: true,
}

function fromPreset(p: WaPreset): Draft {
  return {
    name: p.name,
    displayName: p.title,
    category: p.category,
    language: 'en',
    headerFormat: p.header ? 'TEXT' : 'NONE',
    header: p.header?.text ?? '',
    headerVar: p.header?.var ?? { source: 'shop_name' },
    body: p.body,
    bodyVars: p.bodyVars,
    footer: p.footer ?? '',
    buttons: p.buttons,
    forShops: p.forShops,
  }
}

/**
 * Make a WhatsApp template and send it to Interakt for Meta's approval. Blanks
 * ({{1}}, {{2}}…) are set to fill from the customer, shop or order, or typed by
 * the shop owner when sending. The preview shows it as WhatsApp will.
 */
export function TemplateEditorSheet({ open, onOpenChange, state, preset, onCreated }: TemplateEditorSheetProps) {
  const [d, setD] = useState<Draft>(EMPTY)
  const [image, setImage] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) {
      setD(preset ? fromPreset(preset) : EMPTY)
      setImage(null)
      setErrors({})
    }
  }, [open, preset])

  const blanks = countBlanks(d.body)
  // Keep one variable row per {{n}} in the body.
  useEffect(() => {
    setD((prev) => {
      if (prev.bodyVars.length === blanks) return prev
      const next = prev.bodyVars.slice(0, blanks)
      while (next.length < blanks) next.push({ source: 'custom', label: '' })
      return { ...prev, bodyVars: next }
    })
  }, [blanks])

  const imageUrl = useMemo(() => (image ? URL.createObjectURL(image) : null), [image])
  useEffect(() => () => (imageUrl ? URL.revokeObjectURL(imageUrl) : undefined), [imageUrl])

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setD((prev) => ({ ...prev, [key]: value }))

  function addBlank() {
    const el = bodyRef.current
    const token = `{{${blanks + 1}}}`
    const at = el?.selectionStart ?? d.body.length
    set('body', d.body.slice(0, at) + token + d.body.slice(at))
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(at + token.length, at + token.length)
    })
  }

  function setButton(i: number, patch: Partial<TemplateButton>) {
    set('buttons', d.buttons.map((b, j) => (j === i ? { ...b, ...patch } : b)))
  }

  const headerHasBlank = d.headerFormat === 'TEXT' && countBlanks(d.header) > 0
  const err = (key: string) => errors[key]?.[0]

  async function submit() {
    setSaving(true)
    setErrors({})
    const payload: Record<string, unknown> = {
      name: d.name,
      displayName: d.displayName || undefined,
      category: d.category,
      language: d.language,
      headerFormat: d.headerFormat === 'NONE' ? null : d.headerFormat,
      header: d.headerFormat === 'TEXT' ? d.header : undefined,
      headerVar: headerHasBlank ? d.headerVar : undefined,
      body: d.body,
      bodyVars: d.bodyVars,
      footer: d.footer || undefined,
      buttons: d.buttons,
      forShops: d.category === 'MARKETING' && d.forShops,
    }

    try {
      let created: WaTemplate
      if (d.headerFormat === 'IMAGE' && image) {
        const form = new FormData()
        Object.entries(payload).forEach(([k, v]) => {
          if (v === undefined || v === null) return
          form.append(k, typeof v === 'object' ? JSON.stringify(v) : typeof v === 'boolean' ? (v ? '1' : '0') : String(v))
        })
        form.append('image', image)
        created = await apiClient.post<WaTemplate>('admin/whatsapp/templates', form)
      } else {
        created = await apiClient.post<WaTemplate>('admin/whatsapp/templates', payload)
      }
      toast.success('Sent for approval', 'WhatsApp usually reviews it in a few minutes, sometimes up to a day.')
      onCreated(created)
      onOpenChange(false)
    } catch (e) {
      if (e instanceof ApiError) {
        setErrors((e.errors as Record<string, string[]>) ?? {})
        toast.error(e.message)
      } else toast.error('Could not submit the template.')
    } finally {
      setSaving(false)
    }
  }

  const valid = d.name.trim() && d.body.trim() && d.bodyVars.every((v) => v.source !== 'custom' || v.label?.trim())

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-4xl">
        <SheetHeader>
          <SheetTitle>{preset ? `New template: ${preset.title}` : 'New WhatsApp template'}</SheetTitle>
          <SheetDescription>
            It goes to WhatsApp for approval. Once approved you can use it for automatic messages or give it to shops.
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-6 px-4 pb-4 lg:grid-cols-[1fr_300px]">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="wt-name">Template name</Label>
                <Input
                  id="wt-name"
                  value={d.name}
                  onChange={(e) => set('name', e.target.value.toLowerCase().replace(/[^a-z0-9_]+/g, '_'))}
                  placeholder="diwali_offer"
                  aria-invalid={!!err('name')}
                />
                <p className="text-small text-text-muted">{err('name') ?? 'Small letters, numbers and _ only. Can’t be reused.'}</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wt-display">Name shops see</Label>
                <Input id="wt-display" value={d.displayName} maxLength={120} onChange={(e) => set('displayName', e.target.value)} placeholder="Diwali offer" />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={d.category} onValueChange={(v) => set('category', v as Draft['category'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MARKETING">Marketing — offers, discounts, news</SelectItem>
                    <SelectItem value="UTILITY">Utility — order updates, alerts</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-small text-text-muted">OTP templates are made in Interakt, then synced here.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Language</Label>
                <Select value={d.language} onValueChange={(v) => set('language', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(state.languages).map(([code, label]) => (
                      <SelectItem key={code} value={code}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Header */}
            <div className="space-y-2">
              <Label>Heading (optional)</Label>
              <div className="flex gap-2">
                {(['NONE', 'TEXT', 'IMAGE'] as const).map((f) => (
                  <Button key={f} type="button" size="sm" variant={d.headerFormat === f ? 'primary' : 'outline'} onClick={() => set('headerFormat', f)}>
                    {f === 'NONE' ? 'None' : f === 'TEXT' ? 'Text' : 'Image'}
                  </Button>
                ))}
              </div>
              {d.headerFormat === 'TEXT' && (
                <>
                  <Input value={d.header} maxLength={60} onChange={(e) => set('header', e.target.value)} placeholder="Special offer at {{1}} 🎉" aria-invalid={!!err('header')} />
                  {err('header') && <p className="text-small text-danger">{err('header')}</p>}
                  {headerHasBlank && <VarEditor name="{{1}}" value={d.headerVar} onChange={(v) => set('headerVar', v)} sources={state.sources} withSample />}
                </>
              )}
              {d.headerFormat === 'IMAGE' && (
                <Input type="file" accept="image/jpeg,image/png" onChange={(e) => setImage(e.target.files?.[0] ?? null)} aria-invalid={!!err('image')} />
              )}
            </div>

            {/* Body */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="wt-body">Message</Label>
                <Button type="button" size="sm" variant="ghost" leftIcon={<Braces className="size-4" />} onClick={addBlank}>
                  Add blank {`{{${blanks + 1}}}`}
                </Button>
              </div>
              <Textarea
                id="wt-body"
                ref={bodyRef}
                rows={6}
                maxLength={1024}
                value={d.body}
                onChange={(e) => set('body', e.target.value)}
                placeholder={'Hi {{1}}, get *{{2}}* at {{3}} today!'}
                aria-invalid={!!err('body')}
              />
              <p className={err('body') ? 'text-small text-danger' : 'text-small text-text-muted'}>
                {err('body') ?? '*bold*, _italic_. Blanks in order {{1}}, {{2}}… The message can’t start or end with a blank.'}
              </p>
              {d.bodyVars.length > 0 && (
                <div className="space-y-2">
                  <p className="text-caption font-medium text-foreground">What goes in each blank</p>
                  {d.bodyVars.map((v, i) => (
                    <VarEditor
                      key={i}
                      name={`{{${i + 1}}}`}
                      value={v}
                      sources={state.sources}
                      withSample
                      onChange={(next) => set('bodyVars', d.bodyVars.map((x, j) => (j === i ? next : x)))}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wt-footer">Small text at the bottom (optional)</Label>
              <Input id="wt-footer" value={d.footer} maxLength={60} onChange={(e) => set('footer', e.target.value)} placeholder="Reply STOP to stop offers" />
            </div>

            {/* Buttons */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Buttons (optional, up to 3)</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  leftIcon={<Plus className="size-4" />}
                  disabled={d.buttons.length >= 3}
                  onClick={() => set('buttons', [...d.buttons, { type: 'URL', text: '', url: 'https://listee.org/b/{{1}}', var: { source: 'shop_slug' } }])}
                >
                  Add button
                </Button>
              </div>
              {d.buttons.map((b, i) => (
                <div key={i} className="space-y-2 rounded-xl border border-border p-2.5">
                  <div className="flex gap-2">
                    <Select value={b.type} onValueChange={(v) => setButton(i, { type: v })}>
                      <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="URL">Open link</SelectItem>
                        <SelectItem value="PHONE_NUMBER">Call</SelectItem>
                        <SelectItem value="QUICK_REPLY">Quick reply</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input className="h-9" value={b.text ?? ''} maxLength={25} onChange={(e) => setButton(i, { text: e.target.value })} placeholder="Button text" />
                    <Button type="button" size="icon" variant="ghost" className="size-9 shrink-0" aria-label="Remove button" onClick={() => set('buttons', d.buttons.filter((_, j) => j !== i))}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  {b.type === 'URL' && (
                    <>
                      <Input className="h-9" value={b.url ?? ''} onChange={(e) => setButton(i, { url: e.target.value })} placeholder="https://listee.org/b/{{1}}" />
                      {countBlanks(b.url) > 0 && (
                        <VarEditor name="{{1}}" value={b.var ?? { source: 'shop_slug' }} sources={state.sources} onChange={(v) => setButton(i, { var: v })} />
                      )}
                    </>
                  )}
                  {b.type === 'PHONE_NUMBER' && (
                    <Input className="h-9" value={b.phone_number ?? ''} onChange={(e) => setButton(i, { phone_number: e.target.value })} placeholder="+919876543210" />
                  )}
                  {Object.entries(errors)
                    .filter(([k]) => k.startsWith(`buttons.${i}.`))
                    .map(([k, m]) => (
                      <p key={k} className="text-small text-danger">{m[0]}</p>
                    ))}
                </div>
              ))}
            </div>

            {d.category === 'MARKETING' && (
              <label className="flex items-start justify-between gap-3 rounded-xl border border-border p-3">
                <span>
                  <span className="block text-caption font-semibold text-foreground">Ready-made for shops</span>
                  <span className="text-small text-text-muted">Once approved, shop owners can send it as a WhatsApp offer, filling in their blanks.</span>
                </span>
                <Switch checked={d.forShops} onCheckedChange={(v) => set('forShops', v)} />
              </label>
            )}
          </div>

          <div className="space-y-2 lg:sticky lg:top-4 lg:self-start">
            <p className="text-small font-medium text-text-muted">Preview</p>
            <WhatsAppPreview
              headerFormat={d.headerFormat === 'NONE' ? null : d.headerFormat}
              header={d.header}
              headerValue={headerHasBlank ? sampleFor(d.headerVar, state.sources) : undefined}
              headerImageUrl={imageUrl}
              body={d.body}
              values={d.bodyVars.map((v) => sampleFor(v, state.sources))}
              footer={d.footer}
              buttons={d.buttons}
              shopName="Sharma Sweets"
            />
          </div>
        </div>

        <SheetFooter className="flex-row justify-end gap-2 border-t border-border">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button leftIcon={<Send className="size-4" />} disabled={!valid || (d.headerFormat === 'IMAGE' && !image)} isLoading={saving} onClick={() => void submit()}>
            Send for approval
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
