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
import { ImageCropField } from '@/components/forms/ImageCropField'
import { Stepper } from '@/components/navigation/Stepper'
import { ProductCategorySelect, type MenuSectionValue } from './ProductCategorySelect'
import { useProductActions } from '../hooks/useProducts'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { MESSAGES } from '@/constants/messages'
import type { FoodType, Product, ProductFormValues } from '../productTypes'

const STEPS = ['Basics', 'Pricing', 'Details']

interface ProductFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
}

interface FormState {
  name: string
  section: MenuSectionValue
  foodType: FoodType | 'none'
  description: string
  ingredients: string
  mrp: string
  sellingPrice: string
  prepMinutes: string
  availableFrom: string
  availableTo: string
  image: File | null
  isTodaysSpecial: boolean
  isBestseller: boolean
  isRecommended: boolean
  inStock: boolean
  isVisible: boolean
}

function initialState(product: Product | null): FormState {
  return {
    name: product?.name ?? '',
    section: { id: product?.categoryId ?? null, name: null },
    foodType: product?.foodType ?? 'none',
    description: product?.description ?? '',
    ingredients: product?.ingredients ?? '',
    mrp: product?.mrp != null ? String(product.mrp) : '',
    sellingPrice: product?.sellingPrice != null ? String(product.sellingPrice) : '',
    prepMinutes: product?.prepMinutes != null ? String(product.prepMinutes) : '',
    availableFrom: product?.availableFrom?.slice(0, 5) ?? '',
    availableTo: product?.availableTo?.slice(0, 5) ?? '',
    image: null,
    isTodaysSpecial: product?.isTodaysSpecial ?? false,
    isBestseller: product?.isBestseller ?? false,
    isRecommended: product?.isRecommended ?? false,
    inStock: product?.inStock ?? true,
    isVisible: product?.isVisible ?? true,
  }
}

/**
 * Create / edit a product via a short wizard (07B rule 9). Basics → Pricing →
 * Details. Menu section can be created on the fly; image cropped via the shared
 * ImageCropField.
 */
export function ProductForm({ open, onOpenChange, product }: ProductFormProps) {
  const { create, update } = useProductActions()
  const isEdit = product !== null

  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(() => initialState(product))
  const [errors, setErrors] = useState<{ name?: string; sellingPrice?: string }>({})

  useEffect(() => {
    if (open) {
      setForm(initialState(product))
      setStep(0)
      setErrors({})
    }
  }, [open, product])

  const pending = create.isPending || update.isPending

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function validateStep(target: number): boolean {
    if (target > 0 && !form.name.trim()) {
      setErrors((e) => ({ ...e, name: 'Product name is required.' }))
      setStep(0)
      return false
    }
    if (target > 1) {
      const price = Number(form.sellingPrice)
      if (!form.sellingPrice || Number.isNaN(price) || price < 0) {
        setErrors((e) => ({ ...e, sellingPrice: 'Enter a valid selling price.' }))
        setStep(1)
        return false
      }
    }
    return true
  }

  function next() {
    if (validateStep(step + 1)) setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  async function handleSubmit() {
    if (!validateStep(2)) return

    const values: ProductFormValues = {
      name: form.name.trim(),
      categoryId: form.section.id,
      categoryName: form.section.name,
      description: form.description.trim(),
      ingredients: form.ingredients.trim(),
      mrp: form.mrp ? Number(form.mrp) : null,
      sellingPrice: Number(form.sellingPrice),
      foodType: form.foodType === 'none' ? null : form.foodType,
      availableFrom: form.availableFrom || undefined,
      availableTo: form.availableTo || undefined,
      prepMinutes: form.prepMinutes ? Number(form.prepMinutes) : null,
      isTodaysSpecial: form.isTodaysSpecial,
      isBestseller: form.isBestseller,
      isRecommended: form.isRecommended,
      inStock: form.inStock,
      isVisible: form.isVisible,
      image: form.image,
    }

    try {
      if (isEdit) {
        await update.mutateAsync({ id: product.id, values })
        toast.success('Product updated')
      } else {
        await create.mutateAsync(values)
        toast.success('Product added')
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : MESSAGES.errors.generic)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full max-w-md flex-col gap-0 p-0">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle>{isEdit ? 'Edit product' : 'Add product'}</SheetTitle>
          <SheetDescription>Keep it quick — you can fine-tune anytime.</SheetDescription>
          <div className="pt-3">
            <Stepper steps={STEPS} current={step} />
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {step === 0 && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="p-name">Product name</Label>
                <Input
                  id="p-name"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="e.g. Cheese Burger"
                  aria-invalid={Boolean(errors.name)}
                />
                {errors.name && <p className="text-caption text-destructive">{errors.name}</p>}
              </div>

              <ProductCategorySelect value={form.section} onChange={(v) => set('section', v)} />

              <div className="space-y-1.5">
                <Label htmlFor="p-food">Food type</Label>
                <Select value={form.foodType} onValueChange={(v) => set('foodType', v as FoodType | 'none')}>
                  <SelectTrigger id="p-food" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not applicable</SelectItem>
                    <SelectItem value="veg">Veg</SelectItem>
                    <SelectItem value="non_veg">Non-veg</SelectItem>
                    <SelectItem value="egg">Egg</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="p-desc">Description (optional)</Label>
                <Textarea
                  id="p-desc"
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  rows={3}
                  placeholder="Short, tasty description"
                />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="p-mrp">MRP (₹)</Label>
                  <Input
                    id="p-mrp"
                    inputMode="decimal"
                    value={form.mrp}
                    onChange={(e) => set('mrp', e.target.value)}
                    placeholder="200"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-price">Selling price (₹)</Label>
                  <Input
                    id="p-price"
                    inputMode="decimal"
                    value={form.sellingPrice}
                    onChange={(e) => set('sellingPrice', e.target.value)}
                    placeholder="160"
                    aria-invalid={Boolean(errors.sellingPrice)}
                  />
                  {errors.sellingPrice && (
                    <p className="text-caption text-destructive">{errors.sellingPrice}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="p-prep">Preparation time (minutes, optional)</Label>
                <Input
                  id="p-prep"
                  inputMode="numeric"
                  value={form.prepMinutes}
                  onChange={(e) => set('prepMinutes', e.target.value)}
                  placeholder="15"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="p-from">Available from</Label>
                  <Input id="p-from" type="time" value={form.availableFrom} onChange={(e) => set('availableFrom', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-to">Available to</Label>
                  <Input id="p-to" type="time" value={form.availableTo} onChange={(e) => set('availableTo', e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="p-ingredients">Ingredients (optional)</Label>
                <Textarea
                  id="p-ingredients"
                  value={form.ingredients}
                  onChange={(e) => set('ingredients', e.target.value)}
                  rows={2}
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <ImageCropField
                label="Product image"
                shape="rect"
                aspect={4 / 3}
                value={form.image}
                previewUrl={product?.imageUrl}
                onChange={(f) => set('image', f)}
                hint="A bright, appetising photo works best."
              />

              <FlagRow label="Today's special" checked={form.isTodaysSpecial} onChange={(v) => set('isTodaysSpecial', v)} />
              <FlagRow label="Bestseller" checked={form.isBestseller} onChange={(v) => set('isBestseller', v)} />
              <FlagRow label="Recommended" checked={form.isRecommended} onChange={(v) => set('isRecommended', v)} />
              <FlagRow label="In stock" checked={form.inStock} onChange={(v) => set('inStock', v)} />
              <FlagRow label="Visible on menu" checked={form.isVisible} onChange={(v) => set('isVisible', v)} />
            </>
          )}
        </div>

        <SheetFooter className="flex-row justify-between border-t border-border px-5 py-4">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={pending}>
              Back
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={next}>Next</Button>
          ) : (
            <Button onClick={() => void handleSubmit()} isLoading={pending}>
              {isEdit ? 'Save product' : 'Add product'}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function FlagRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between gap-4 py-0.5">
      <span className="text-caption font-medium text-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  )
}
