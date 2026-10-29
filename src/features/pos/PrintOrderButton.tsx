import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOwnerBusiness } from '@/features/owner/hooks/useOwner'
import type { Order } from '@/features/owner/orderTypes'
import { loadPrinter, orderPages, printPages } from '@/features/pos/printing'
import { toast } from '@/utils/toast'

/** Prints an order's bill (and KOT, when switched on) on this device's printer. */
export function PrintOrderButton({ order }: { order: Order }) {
  const { data: business } = useOwnerBusiness()

  async function print() {
    const settings = loadPrinter()
    try {
      await printPages(
        orderPages(order, { name: business?.name ?? 'Bill', address: business?.address, phone: business?.phone }, settings, 'both'),
        settings,
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not print.')
    }
  }

  return (
    <Button size="sm" variant="ghost" leftIcon={<Printer className="size-4" />} onClick={() => void print()}>
      Print
    </Button>
  )
}
