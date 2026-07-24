import { useEffect, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { MESSAGES } from '@/constants/messages'
import { useAdminCategories, useBusinessActions } from '@/features/admin/hooks/useAdmin'
import type { AdminBusiness } from '@/features/admin/types'

interface BusinessEditSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  business: AdminBusiness | null
}

interface FormState {
  name: string
  categoryId: string
  description: string
  address: string
  phone: string
  email: string
  website: string
  facebook: string
  instagram: string
  whatsapp: string
  gst: string
  openingTime: string
  closingTime: string
  active: boolean
}

function initial(b: AdminBusiness | null): FormState {
  return {
    name: b?.name ?? '',
    categoryId: b?.categoryId ?? '',
    description: b?.description ?? '',
    address: b?.address ?? '',
    phone: b?.phone ?? '',
    email: b?.email ?? '',
    website: b?.website ?? '',
    facebook: b?.facebook ?? '',
    instagram: b?.instagram ?? '',
    whatsapp: b?.whatsapp ?? '',
    gst: b?.gst ?? '',
    openingTime: b?.openingTime ?? '',
    closingTime: b?.closingTime ?? '',
    active: b?.status === 'active',
  }
}

/** Edit all details of a business from the admin panel, with an active toggle. */
export function BusinessEditSheet({ open, onOpenChange, business }: BusinessEditSheetProps) {
  const { update } = useBusinessActions()
  const { data: categories } = useAdminCategories()

  const [form, setForm] = useState<FormState>(() => initial(business))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm(initial(business))
      setError(null)
    }
  }, [open, business])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    if (!business) return
    if (!form.name.trim()) {
      setError('Business name is required.')
      return
    }
    try {
      await update.mutateAsync({
        id: business.id,
        input: {
          name: form.name.trim(),
          categoryId: form.categoryId || null,
          description: form.description.trim() || null,
          address: form.address.trim() || null,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          website: form.website.trim() || null,
          facebook: form.facebook.trim() || null,
          instagram: form.instagram.trim() || null,
          whatsapp: form.whatsapp.trim() || null,
          gst: form.gst.trim() || null,
          openingTime: form.openingTime || null,
          closingTime: form.closingTime || null,
          // Only flip active/suspended here; pending/rejected keep their state.
          status: form.active ? 'active' : business.status === 'active' ? 'suspended' : business.status,
        },
      })
      toast.success('Business updated')
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : MESSAGES.errors.generic)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full max-w-md flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle>Edit business</SheetTitle>
          <SheetDescription>{business?.name}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <label className="flex items-center justify-between gap-4 rounded-xl bg-surface-muted p-3">
            <span>
              <span className="block text-caption font-semibold text-foreground">Active</span>
              <span className="block text-small text-text-muted">Live and visible to customers.</span>
            </span>
            <Switch checked={form.active} onCheckedChange={(v) => set('active', v)} />
          </label>

          <div className="space-y-1.5">
            <Label htmlFor="b-name">Business name</Label>
            <Input id="b-name" value={form.name} onChange={(e) => set('name', e.target.value)} aria-invalid={Boolean(error)} />
            {error && <p className="text-caption text-destructive">{error}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="b-category">Category</Label>
            <Select value={form.categoryId} onValueChange={(v) => set('categoryId', v)}>
              <SelectTrigger id="b-category" className="w-full">
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {(categories ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="b-desc">Description</Label>
            <Textarea id="b-desc" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="b-address">Address</Label>
            <Textarea id="b-address" rows={2} value={form.address} onChange={(e) => set('address', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="b-phone">Phone</Label>
              <Input id="b-phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b-email">Email</Label>
              <Input id="b-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="b-open">Opening time</Label>
              <Input id="b-open" type="time" value={form.openingTime} onChange={(e) => set('openingTime', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b-close">Closing time</Label>
              <Input id="b-close" type="time" value={form.closingTime} onChange={(e) => set('closingTime', e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="b-website">Website</Label>
            <Input id="b-website" value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="b-fb">Facebook</Label>
              <Input id="b-fb" value={form.facebook} onChange={(e) => set('facebook', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b-ig">Instagram</Label>
              <Input id="b-ig" value={form.instagram} onChange={(e) => set('instagram', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="b-wa">WhatsApp</Label>
              <Input id="b-wa" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b-gst">GST</Label>
              <Input id="b-gst" value={form.gst} onChange={(e) => set('gst', e.target.value)} />
            </div>
          </div>
        </div>

        <SheetFooter className="flex-row justify-end gap-2 border-t border-border px-5 py-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={update.isPending}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} isLoading={update.isPending}>
            Save changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
