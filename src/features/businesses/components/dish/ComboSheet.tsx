import type { ReactNode } from 'react'
import { Coins, Utensils, X } from 'lucide-react'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { ComboTimer } from '@/features/combos/components/ComboTimer'
import { Collage, type ComboCardData } from './ComboCard'

interface ComboSheetProps {
  combo: ComboCardData | null
  onOpenChange: (open: boolean) => void
  /** Under the name — e.g. the shop on the home feed. */
  subtitle?: ReactNode
  /** Bottom-right action: the ADD stepper, or a link to the shop. */
  action?: ReactNode
}

/**
 * A combo opened up: its photo (or the items tiled), every item listed with
 * its photo, quantity and what it costs alone, then the maths — what it would
 * cost apart, the combo price and the saving. Replaces the full-screen photo
 * viewer for combos, where one picture couldn't show what's inside.
 */
export function ComboSheet({ combo, onOpenChange, subtitle, action }: ComboSheetProps) {
  return (
    <Sheet open={combo !== null} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[90dvh] w-full max-w-lg gap-0 overflow-hidden rounded-t-3xl p-0"
        aria-describedby={undefined}
        showCloseButton={false}
        // Focus the sheet itself, not the close button (which would show a ring on open).
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          ;(e.currentTarget as HTMLElement).focus()
        }}
      >
        {combo && (
          <>
            <div className="flex-1 overflow-y-auto">
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-muted">
                {combo.imageUrl ? (
                  <img src={combo.imageUrl} alt="" className="size-full object-cover" />
                ) : (
                  <Collage items={combo.items} />
                )}
                <ComboTimer endsAt={combo.endsAt} className="absolute bottom-3 left-3" />
                <SheetClose
                  className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-black/60 text-white shadow-lg ring-1 ring-white/30 backdrop-blur transition-colors hover:bg-black/80"
                  aria-label="Close"
                >
                  <X className="size-5" aria-hidden />
                </SheetClose>
              </div>

              <div className="space-y-4 p-4">
                <div>
                  <SheetTitle className="text-subtitle font-bold leading-snug text-foreground">{combo.name}</SheetTitle>
                  {subtitle && <SheetDescription asChild><div>{subtitle}</div></SheetDescription>}
                </div>

                <div>
                  <p className="mb-2 text-small font-semibold uppercase tracking-wide text-text-muted">
                    What's inside · {combo.items.length} items
                  </p>
                  <ul className="divide-y divide-border rounded-2xl border border-border">
                    {combo.items.map((item, i) => (
                      <li key={`${item.productId ?? 'x'}-${i}`} className="flex items-center gap-3 p-2.5">
                        <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-muted">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt="" loading="lazy" className="size-full object-cover" />
                          ) : (
                            <Utensils className="size-4 text-text-muted" aria-hidden />
                          )}
                        </span>
                        <span className="min-w-0 flex-1 text-body font-medium leading-snug text-foreground">
                          {item.quantity > 1 && <span className="font-bold text-primary">{item.quantity}× </span>}
                          {item.name ?? 'Item'}
                        </span>
                        {item.sellingPrice != null && (
                          <span className="shrink-0 text-caption text-text-muted">
                            ₹{item.sellingPrice * Math.max(1, item.quantity)}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-1.5 rounded-2xl bg-surface-muted p-3 text-caption">
                  {combo.totalPrice > combo.comboPrice && (
                    <div className="flex justify-between text-text-secondary">
                      <span>Bought separately</span>
                      <span className="line-through">₹{combo.totalPrice}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-body font-bold text-foreground">
                    <span>Combo price</span>
                    <span>₹{combo.comboPrice}</span>
                  </div>
                  {combo.savings > 0 && (
                    <div className="flex justify-between font-semibold text-success">
                      <span>You save</span>
                      <span>₹{combo.savings}</span>
                    </div>
                  )}
                  {combo.coinsEarned ? (
                    <div className="flex items-center gap-1 pt-1 font-medium text-premium-foreground">
                      <Coins className="size-3.5 text-gold" aria-hidden /> Earn +{combo.coinsEarned} coins with this combo
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {action && (
              <div className="flex items-center justify-between gap-3 border-t border-border px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <span className="text-subtitle font-black text-foreground">₹{combo.comboPrice}</span>
                {action}
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
