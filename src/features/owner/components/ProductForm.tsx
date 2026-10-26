import { useEffect, useState, type ReactNode } from 'react'
import { ChevronDown, ChevronRight, Layers, ListPlus, NotebookText, Tags } from 'lucide-react'
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
import { Stepper } from '@/components/navigation/Stepper'
import { ProductEssentials } from './ProductEssentials'
import { OptionRowsEditor } from './OptionRowsEditor'
import {
  applyDiscount,
  filledOptions,
  newOptionRow,
  pricing,
  validateEssentials,
  type OptionRow,
  type ProductEssentialsErrors,
  type ProductEssentialsValue,
} from '../productEssentials'
import { useProductActions } from '../hooks/useProducts'
import { toast } from '@/utils/toast'
import { cn } from '@/utils/cn'
import { ApiError } from '@/types/api'
import { MESSAGES } from '@/constants/messages'
import type { Product, ProductFormValues } from '../productTypes'

const STEPS = ['Product', 'More (optional)']

interface ProductFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
}

interface MoreState {
  description: string
  ingredients: string
  prepMinutes: string
  availableFrom: string
  availableTo: string
  isTodaysSpecial: boolean
  isBestseller: boolean
  isRecommended: boolean
  inStock: boolean
  /** Units in stock; blank = not counted. */
  stockQty: string
  isVisible: boolean
}

type Panel = 'sizes' | 'addons' | 'details' | 'tags'

function initialEssentials(product: Product | null): ProductEssentialsValue {
  // An older product's MRP shows as a ₹-off discount, so nothing is lost on edit.
  const legacyOff =
    !product?.discount && product?.mrp != null && product.mrp > product.sellingPrice
      ? { type: 'flat' as const, value: Math.round((product.mrp - product.sellingPrice) * 100) / 100 }
      : null
  const listPrice = product ? (product.discount || legacyOff ? (product.mrp ?? product.sellingPrice) : product.sellingPrice) : null
  return {
    image: null,
    name: product?.name ?? '',
    price: listPrice != null ? String(listPrice) : '',
    discount: product?.discount ?? legacyOff,
    foodType: product?.foodType ?? null,
    section: { id: product?.categoryId ?? null, name: null },
  }
}

function initialMore(product: Product | null): MoreState {
  return {
    description: product?.description ?? '',
    ingredients: product?.ingredients ?? '',
    prepMinutes: product?.prepMinutes != null ? String(product.prepMinutes) : '',
    availableFrom: product?.availableFrom?.slice(0, 5) ?? '',
    availableTo: product?.availableTo?.slice(0, 5) ?? '',
    isTodaysSpecial: product?.isTodaysSpecial ?? false,
    isBestseller: product?.isBestseller ?? false,
    isRecommended: product?.isRecommended ?? false,
    inStock: product?.inStock ?? true,
    stockQty: product?.stockQty != null ? String(product.stockQty) : '',
    isVisible: product?.isVisible ?? true,
  }
}

const toRows = (
  list: { id?: string; name: string; price: number; type?: string | null; qty?: string | null }[] | undefined,
): OptionRow[] =>
  (list ?? []).map((o) => ({ ...newOptionRow(o.name, String(o.price)), id: o.id, type: o.type ?? '', qty: o.qty ?? '' }))

/** "Fried · Half · 6 pcs" for the closed Sizes card. */
const sizeLabel = (s: { name: string; type?: string | null; qty?: string | null }) =>
  [s.type, s.name, s.qty].filter(Boolean).join(' · ')

/**
 * Create / edit a product (07B rule 9). Step one is all a product needs —
 * photo, name, price (with an optional % / ₹ discount) — and saves right
 * there. Step two folds sizes, add-ons, details and tags into small cards
 * that stay closed until wanted, so the form never looks long.
 */
export function ProductForm({ open, onOpenChange, product }: ProductFormProps) {
  const { create, update } = useProductActions()
  const isEdit = product !== null

  const [step, setStep] = useState(0)
  const [essentials, setEssentials] = useState(() => initialEssentials(product))
  const [more, setMore] = useState(() => initialMore(product))
  const [sizes, setSizes] = useState<OptionRow[]>(() => toRows(product?.variants))
  const [addons, setAddons] = useState<OptionRow[]>(() => toRows(product?.addons))
  const [openPanel, setOpenPanel] = useState<Panel | null>(null)
  const [errors, setErrors] = useState<ProductEssentialsErrors>({})

  useEffect(() => {
    if (open) {
      setEssentials(initialEssentials(product))
      setMore(initialMore(product))
      setSizes(toRows(product?.variants))
      setAddons(toRows(product?.addons))
      setOpenPanel(null)
      setStep(0)
      setErrors({})
    }
  }, [open, product])

  const pending = create.isPending || update.isPending
  const filledSizes = filledOptions(sizes)
  const filledAddons = filledOptions(addons)
  // With sizes, the cheapest one is the price the menu shows "from".
  const sizesFrom = filledSizes.length > 0 ? Math.min(...filledSizes.map((s) => s.price)) : null

  function setM<K extends keyof MoreState>(key: K, value: MoreState[K]) {
    setMore((m) => ({ ...m, [key]: value }))
  }

  async function handleSubmit() {
    const found = validateEssentials(
      sizesFrom != null ? { ...essentials, price: String(sizesFrom) } : essentials,
    )
    setErrors(found)
    if (Object.keys(found).length > 0) {
      setStep(0)
      return
    }

    const listPrice = sizesFrom ?? Number(essentials.price)
    const discount = essentials.discount && essentials.discount.value > 0 ? essentials.discount : null
    const { mrp, sellingPrice } = pricing(listPrice, discount)

    const values: ProductFormValues = {
      name: essentials.name.trim(),
      categoryId: essentials.section.id,
      categoryName: essentials.section.name?.trim() || null,
      description: more.description.trim(),
      ingredients: more.ingredients.trim(),
      mrp,
      sellingPrice,
      discount,
      variants: filledSizes,
      addons: filledAddons,
      foodType: essentials.foodType,
      availableFrom: more.availableFrom || undefined,
      availableTo: more.availableTo || undefined,
      prepMinutes: more.prepMinutes ? Number(more.prepMinutes) : null,
      isTodaysSpecial: more.isTodaysSpecial,
      isBestseller: more.isBestseller,
      isRecommended: more.isRecommended,
      inStock: more.inStock,
      stockQty: more.stockQty.trim() === '' ? null : Number(more.stockQty),
      isVisible: more.isVisible,
      image: essentials.image,
    }

    try {
      if (isEdit) {
        await update.mutateAsync({ id: product.id, values })
        toast.success('Product updated')
      } else {
        await create.mutateAsync(values)
        toast.success('Product added to your menu')
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : MESSAGES.errors.generic)
    }
  }

  const toggle = (panel: Panel) => setOpenPanel((p) => (p === panel ? null : panel))
  const tagCount = [more.isBestseller, more.isTodaysSpecial, more.isRecommended].filter(Boolean).length

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full max-w-md flex-col gap-0 p-0"
        // A stray tap beside the form must not throw away what was typed — the
        // ✕ above and Cancel below close it.
        onInteractOutside={(e) => e.preventDefault()}
      >
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle>{isEdit ? 'Edit product' : 'Add product'}</SheetTitle>
          <SheetDescription>Photo, name and price — that's all you need.</SheetDescription>
          <div className="pt-3">
            <Stepper steps={STEPS} current={step} />
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {step === 0 && (
            <>
              <ProductEssentials
                value={essentials}
                onChange={(patch) => setEssentials((e) => ({ ...e, ...patch }))}
                errors={errors}
                existingImageUrl={product?.imageUrl}
                sizesFrom={sizesFrom}
              />
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex w-full items-center justify-between rounded-xl border border-border bg-surface-muted px-4 py-3 text-left text-caption font-semibold text-foreground transition-colors hover:border-border-strong"
              >
                <span>
                  Sizes, add-ons & more
                  <span className="block text-small font-normal text-text-muted">
                    Small / Large, extra cheese, description, bestseller tag…
                  </span>
                </span>
                <ChevronRight className="size-4 text-text-muted" aria-hidden />
              </button>
            </>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <MorePanel
                icon={<Layers className="size-4" />}
                title="Sizes & types"
                summary={
                  filledSizes.length > 0
                    ? filledSizes.map(sizeLabel).join(', ')
                    : 'Half / Full, 6 pcs, Steam / Fried — each with its own price'
                }
                count={filledSizes.length}
                open={openPanel === 'sizes'}
                onToggle={() => toggle('sizes')}
              >
                <OptionRowsEditor
                  rows={sizes}
                  onChange={setSizes}
                  namePlaceholder="Size, e.g. Half"
                  pricePlaceholder="199"
                  addLabel="Add size"
                  suggestions={['Small', 'Medium', 'Large', 'Half', 'Full', 'Regular']}
                  max={30}
                  withTypeAndQty
                />
                {sizesFrom != null && essentials.discount && essentials.discount.value > 0 && (
                  <p className="text-small text-text-secondary">
                    Your discount applies to every size — the cheapest becomes ₹{applyDiscount(sizesFrom, essentials.discount)}.
                  </p>
                )}
              </MorePanel>

              <MorePanel
                icon={<ListPlus className="size-4" />}
                title="Add-ons"
                summary={
                  filledAddons.length > 0
                    ? filledAddons.map((a) => a.name).join(' · ')
                    : 'Extras customers can add, like extra cheese or a dip'
                }
                count={filledAddons.length}
                open={openPanel === 'addons'}
                onToggle={() => toggle('addons')}
              >
                <OptionRowsEditor
                  rows={addons}
                  onChange={setAddons}
                  namePlaceholder="Add-on, e.g. Extra cheese"
                  pricePlaceholder="30"
                  addLabel="Add add-on"
                  suggestions={['Extra cheese', 'Extra dip', 'Extra toppings', 'Extra sauce']}
                  max={20}
                />
              </MorePanel>

              <MorePanel
                icon={<NotebookText className="size-4" />}
                title="Description & timings"
                summary={more.description.trim() || 'What it is, prep time, when it’s served'}
                open={openPanel === 'details'}
                onToggle={() => toggle('details')}
              >
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="p-desc">Description</Label>
                    <Textarea
                      id="p-desc"
                      value={more.description}
                      onChange={(e) => setM('description', e.target.value)}
                      rows={3}
                      placeholder="Short, tasty description"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="p-prep">Preparation time (minutes)</Label>
                    <Input
                      id="p-prep"
                      inputMode="numeric"
                      value={more.prepMinutes}
                      onChange={(e) => setM('prepMinutes', e.target.value)}
                      placeholder="15"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="p-from">Available from</Label>
                      <Input id="p-from" type="time" value={more.availableFrom} onChange={(e) => setM('availableFrom', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="p-to">Available to</Label>
                      <Input id="p-to" type="time" value={more.availableTo} onChange={(e) => setM('availableTo', e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="p-ingredients">Ingredients</Label>
                    <Textarea
                      id="p-ingredients"
                      value={more.ingredients}
                      onChange={(e) => setM('ingredients', e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              </MorePanel>

              <MorePanel
                icon={<Tags className="size-4" />}
                title="Stock & tags"
                summary={[
                  more.stockQty.trim() !== ''
                    ? `${more.stockQty} in stock`
                    : more.inStock
                      ? 'In stock'
                      : 'Out of stock',
                  !more.isVisible && 'Hidden',
                  tagCount > 0 && `${tagCount} tag${tagCount > 1 ? 's' : ''}`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
                open={openPanel === 'tags'}
                onToggle={() => toggle('tags')}
              >
                <div className="space-y-1.5 pb-2">
                  <Label htmlFor="p-stock">Stock quantity</Label>
                  <Input
                    id="p-stock"
                    inputMode="numeric"
                    value={more.stockQty}
                    onChange={(e) => setM('stockQty', e.target.value.replace(/\D/g, '').slice(0, 7))}
                    placeholder="Leave empty if you don't count"
                  />
                  <p className="text-small text-text-muted">
                    Goes down with every order — alone or in a combo — and turns “Out of stock” at 0.
                  </p>
                </div>
                <div className="divide-y divide-border">
                  {more.stockQty.trim() === '' && (
                    <FlagRow label="In stock" checked={more.inStock} onChange={(v) => setM('inStock', v)} />
                  )}
                  <FlagRow label="Visible on menu" checked={more.isVisible} onChange={(v) => setM('isVisible', v)} />
                  <FlagRow label="Bestseller" checked={more.isBestseller} onChange={(v) => setM('isBestseller', v)} />
                  <FlagRow label="Today's special" checked={more.isTodaysSpecial} onChange={(v) => setM('isTodaysSpecial', v)} />
                  <FlagRow label="Recommended" checked={more.isRecommended} onChange={(v) => setM('isRecommended', v)} />
                </div>
              </MorePanel>
            </div>
          )}
        </div>

        <SheetFooter className="flex-row justify-between gap-3 border-t border-border px-5 py-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(0)} disabled={pending}>
              Back
            </Button>
          )}
          <Button className="flex-1" onClick={() => void handleSubmit()} isLoading={pending}>
            {isEdit ? 'Save product' : 'Add product'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

/** A closed-by-default card: title + one-line summary; tap to open its fields. */
function MorePanel({
  icon,
  title,
  summary,
  count,
  open,
  onToggle,
  children,
}: {
  icon: ReactNode
  title: string
  summary: string
  count?: number
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <div className={cn('rounded-2xl border bg-surface transition-colors', open ? 'border-primary/40 shadow-soft' : 'border-border')}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-caption font-bold text-foreground">
            {title}
            {count != null && count > 0 && (
              <span className="rounded-full bg-primary px-1.5 text-[10px] leading-4 text-primary-foreground">{count}</span>
            )}
          </span>
          <span className="block truncate text-small text-text-muted">{summary}</span>
        </span>
        <ChevronDown className={cn('size-4 shrink-0 text-text-muted transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && <div className="border-t border-border px-4 pb-4 pt-3">{children}</div>}
    </div>
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
    <label className="flex items-center justify-between gap-4 py-3">
      <span className="text-caption font-medium text-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  )
}
