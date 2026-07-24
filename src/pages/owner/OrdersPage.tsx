import { useMemo, useState } from 'react'
import { Bell, BellOff, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Stagger, StaggerItem } from '@/components/motion/Stagger'
import { OrderCard } from '@/features/owner/components/OrderCard'
import { useOwnerOrders, useOrderStatus } from '@/features/owner/hooks/useOrders'
import { useOrderSound, setOrderSound } from '@/features/owner/orderSound'
import { usePageTitle } from '@/hooks/usePageTitle'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { MESSAGES } from '@/constants/messages'
import { armBeep, beep } from '@/utils/beep'
import { cn } from '@/utils/cn'
import type { Order, OrderStatusKey } from '@/features/owner/orderTypes'

const TABS = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

type Range = 'today' | 'all'

/** True when the order was placed on the local calendar day. */
function isToday(order: Order): boolean {
  const raw = order.createdAt ?? order.placedAt
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

export function OrdersPage() {
  usePageTitle('Orders')
  const [tab, setTab] = useState<string>('active')
  const [range, setRange] = useState<Range>('today')
  const soundOn = useOrderSound()
  const { data, isLoading, isError, refetch } = useOwnerOrders(tab)
  const status = useOrderStatus()

  const orders = data ?? []
  const filtered = useMemo(() => {
    const list = data ?? []
    return range === 'today' ? list.filter(isToday) : list
  }, [data, range])

  function handleAction(id: string, next: Exclude<OrderStatusKey, 'placed'>) {
    status.mutate(
      { id, status: next },
      { onError: (err) => toast.error(err instanceof ApiError ? err.message : MESSAGES.errors.generic) },
    )
  }

  function toggleSound() {
    const next = !soundOn
    setOrderSound(next)
    if (next) {
      armBeep()
      beep()
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-title font-bold text-foreground">Orders</h1>
          <p className="text-caption text-text-secondary">New orders appear here automatically.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={soundOn ? <Bell className="size-4" /> : <BellOff className="size-4" />}
          onClick={toggleSound}
        >
          Sound {soundOn ? 'on' : 'off'}
        </Button>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Date filter — default to today's orders. */}
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
      </div>

      {isLoading ? (
        <div className="flex min-h-[40dvh] items-center justify-center">
          <Spinner size={32} label="Loading orders" />
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="size-7" />}
          title={
            range === 'today' && orders.length > 0
              ? 'No orders today'
              : tab === 'active'
                ? 'No active orders'
                : `No ${tab} orders`
          }
          description={
            range === 'today' && orders.length > 0
              ? 'Switch to “All” to see earlier orders.'
              : tab === 'active'
                ? 'When a customer places an order, it shows up here with a sound.'
                : undefined
          }
        />
      ) : (
        <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((order) => (
            <StaggerItem key={order.id}>
              <OrderCard order={order} onAction={handleAction} busy={status.isPending} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  )
}
