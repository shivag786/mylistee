import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Receipt } from 'lucide-react'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Stagger, StaggerItem } from '@/components/motion/Stagger'
import { OrderHistoryCard } from '@/features/orders/OrderHistoryCard'
import { useCustomerOrders } from '@/features/orders/useCustomerOrders'
import { ROUTES } from '@/constants/routes'
import { usePageTitle } from '@/hooks/usePageTitle'
import { cn } from '@/utils/cn'
import type { Order } from '@/features/owner/orderTypes'

type Range = 'today' | 'all'

function orderTime(o: Order): number {
  const d = new Date(o.createdAt ?? o.placedAt ?? 0).getTime()
  return Number.isNaN(d) ? 0 : d
}

function isToday(o: Order): boolean {
  const raw = o.createdAt ?? o.placedAt
  if (!raw) return false
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return false
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

export function OrdersHistoryPage() {
  usePageTitle('My orders')
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useCustomerOrders()
  const [range, setRange] = useState<Range>('all')

  // Newest first, then optional "today" filter.
  const orders = useMemo(() => {
    const sorted = [...(data ?? [])].sort((a, b) => orderTime(b) - orderTime(a))
    return range === 'today' ? sorted.filter(isToday) : sorted
  }, [data, range])

  const total = data?.length ?? 0

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-title font-bold text-foreground">My orders</h1>
          <p className="text-caption text-text-secondary">Your orders, newest first.</p>
        </div>

        <div className="inline-flex rounded-full border border-border bg-surface p-0.5">
          {(['today', 'all'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={cn(
                'rounded-full px-3 py-1 text-caption font-medium capitalize transition-colors',
                range === r ? 'bg-primary text-primary-foreground' : 'text-text-secondary hover:text-foreground',
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </header>

      {isLoading ? (
        <div className="flex min-h-[40dvh] items-center justify-center">
          <Spinner size={32} label="Loading orders" />
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<Receipt className="size-7" />}
          title={range === 'today' && total > 0 ? 'No orders today' : 'No orders yet'}
          description={
            range === 'today' && total > 0
              ? 'Switch to “All” to see earlier orders.'
              : 'When you place an order, it shows up here.'
          }
          actionLabel={range === 'today' && total > 0 ? undefined : 'Explore shops'}
          onAction={range === 'today' && total > 0 ? undefined : () => navigate(ROUTES.home)}
        />
      ) : (
        <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {orders.map((order) => (
            <StaggerItem key={order.id}>
              <OrderHistoryCard order={order} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  )
}
