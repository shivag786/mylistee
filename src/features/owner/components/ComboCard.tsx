import { Pencil, Trash2, Utensils, Coins, EyeOff } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { IconButton } from '@/components/ui/icon-button'
import type { Combo } from '../comboTypes'

interface ComboCardProps {
  combo: Combo
  onEdit: (combo: Combo) => void
  onDelete: (combo: Combo) => void
}

/** Owner combo card (Phase 7.3) — item thumbnails, price vs total, savings. */
export function ComboCard({ combo, onEdit, onDelete }: ComboCardProps) {
  return (
    <Card className="flex h-full flex-col gap-3" padding="md">
      <div className="flex items-start gap-3">
        {combo.imageUrl ? (
          <img
            src={combo.imageUrl}
            alt={combo.name}
            loading="lazy"
            className="size-16 shrink-0 rounded-image object-cover"
          />
        ) : (
          <div className="flex -space-x-3">
            {combo.items.slice(0, 3).map((item) => (
              <span
                key={item.productId}
                className="grid size-10 place-items-center overflow-hidden rounded-full border-2 border-surface bg-surface-muted"
              >
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" className="size-full object-cover" />
                ) : (
                  <Utensils className="size-4 text-text-muted" aria-hidden />
                )}
              </span>
            ))}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-body font-semibold text-foreground">{combo.name}</p>
            {!combo.isVisible && (
              <Badge tone="neutral" className="gap-1">
                <EyeOff className="size-3" aria-hidden /> Hidden
              </Badge>
            )}
          </div>
          <p className="truncate text-small text-text-muted">
            {combo.items.map((i) => i.name).join(' + ')}
          </p>
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-body font-bold text-foreground">₹{combo.comboPrice}</span>
        {combo.totalPrice > combo.comboPrice && (
          <span className="text-small text-text-muted line-through">₹{combo.totalPrice}</span>
        )}
        {combo.savings > 0 && <Badge tone="success">Save ₹{combo.savings}</Badge>}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {combo.coinsEarned ? (
          <Badge tone="premium" className="gap-1">
            <Coins className="size-3" aria-hidden /> +{combo.coinsEarned} coins
          </Badge>
        ) : null}
        {combo.walletCoinsAccepted && <Badge tone="info">Wallet coins ok</Badge>}
        {combo.isActiveNow ? <Badge tone="success">Live</Badge> : <Badge tone="neutral">Off</Badge>}
      </div>

      <div className="mt-auto flex items-center justify-end gap-1 border-t border-border pt-3">
        <Button variant="ghost" size="sm" leftIcon={<Pencil className="size-4" />} onClick={() => onEdit(combo)}>
          Edit
        </Button>
        <IconButton aria-label={`Delete ${combo.name}`} size="sm" onClick={() => onDelete(combo)}>
          <Trash2 className="size-4 text-destructive" aria-hidden />
        </IconButton>
      </div>
    </Card>
  )
}
