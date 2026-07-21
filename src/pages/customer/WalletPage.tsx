import { useNavigate } from 'react-router-dom'
import {
  Wallet,
  Ticket,
  Coins,
  ArrowDownRight,
  ArrowUpRight,
  History,
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Stagger, StaggerItem } from '@/components/motion/Stagger'
import { ROUTES } from '@/constants/routes'
import { MESSAGES } from '@/constants/messages'
import { useWalletSummary, useWalletRewards } from '@/features/wallet/hooks/useWallet'
import { useCoinSummary, useCoinTransactions } from '@/features/wallet/hooks/useCoins'
import { CoinsHero } from '@/features/wallet/components/CoinsHero'
import { RewardCard } from '@/features/wallet/components/RewardCard'
import type { WalletRewardStatus } from '@/features/wallet/services/walletService'
import type { CoinTransaction } from '@/features/wallet/services/coinsService'

export function WalletPage() {
  const { data: summary } = useWalletSummary()
  const { data: coins } = useCoinSummary()

  return (
    <div className="space-y-5">
      <h1 className="text-title font-bold text-foreground">Wallet</h1>

      {coins && <CoinsHero summary={coins} />}

      <Tabs defaultValue="rewards">
        <TabsList className="w-full">
          <TabsTrigger value="rewards" className="flex-1 gap-1.5">
            <Ticket className="size-4" aria-hidden /> Rewards
          </TabsTrigger>
          <TabsTrigger value="coins" className="flex-1 gap-1.5">
            <Coins className="size-4" aria-hidden /> Coin activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rewards" className="space-y-4">
          {summary && (
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Available" value={summary.available} tone="text-success" />
              <Stat label="Used" value={summary.redeemed} tone="text-foreground" />
              <Stat label="Expired" value={summary.expired} tone="text-text-muted" />
            </div>
          )}
          <Tabs defaultValue="active">
            <TabsList className="w-full">
              <TabsTrigger value="active" className="flex-1">
                Available
              </TabsTrigger>
              <TabsTrigger value="redeemed" className="flex-1">
                Used
              </TabsTrigger>
              <TabsTrigger value="expired" className="flex-1">
                Expired
              </TabsTrigger>
            </TabsList>
            <TabsContent value="active">
              <RewardList status="active" />
            </TabsContent>
            <TabsContent value="redeemed">
              <RewardList status="redeemed" />
            </TabsContent>
            <TabsContent value="expired">
              <RewardList status="expired" />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="coins">
          <CoinHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-2xl bg-surface p-3 text-center shadow-soft">
      <p className={`text-subtitle font-bold ${tone}`}>{value}</p>
      <p className="text-small text-text-muted">{label}</p>
    </div>
  )
}

function CoinHistory() {
  const { data: transactions, isLoading, isError, refetch } = useCoinTransactions()

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner size={28} label="Loading coin activity" />
      </div>
    )
  }
  if (isError) {
    return <ErrorState onRetry={() => void refetch()} />
  }
  if (!transactions || transactions.length === 0) {
    return (
      <EmptyState
        icon={<History className="size-7" />}
        title="No coin activity yet"
        description="Spin, check in, and redeem at shops to start earning Listee Coins."
      />
    )
  }

  return (
    <Stagger className="space-y-2 pt-1">
      {transactions.map((txn) => (
        <StaggerItem key={txn.id}>
          <CoinRow txn={txn} />
        </StaggerItem>
      ))}
    </Stagger>
  )
}

function CoinRow({ txn }: { txn: CoinTransaction }) {
  const isCredit = txn.amount >= 0
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-soft">
      <span
        className={`grid size-9 shrink-0 place-items-center rounded-full ${
          isCredit ? 'bg-success/15 text-success' : 'bg-primary-soft text-primary'
        }`}
      >
        {isCredit ? (
          <ArrowUpRight className="size-4" aria-hidden />
        ) : (
          <ArrowDownRight className="size-4" aria-hidden />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-body font-medium text-foreground">{txn.description}</p>
        {txn.businessName && (
          <p className="truncate text-caption text-text-secondary">{txn.businessName}</p>
        )}
      </div>
      <span
        className={`shrink-0 text-body font-bold tabular-nums ${
          isCredit ? 'text-success' : 'text-primary'
        }`}
      >
        {isCredit ? '+' : ''}
        {txn.amount}
      </span>
    </div>
  )
}

function RewardList({ status }: { status: WalletRewardStatus }) {
  const navigate = useNavigate()
  const { data: rewards, isLoading, isError, refetch } = useWalletRewards(status)

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner size={28} label="Loading rewards" />
      </div>
    )
  }
  if (isError) {
    return <ErrorState onRetry={() => void refetch()} />
  }
  if (!rewards || rewards.length === 0) {
    if (status === 'active') {
      return (
        <EmptyState
          icon={<Wallet className="size-7" />}
          title={MESSAGES.empty.wallet.title}
          description={MESSAGES.empty.wallet.description}
          actionLabel={MESSAGES.empty.wallet.action}
          onAction={() => navigate(ROUTES.nearby)}
        />
      )
    }
    return (
      <EmptyState
        icon={<Ticket className="size-7" />}
        title={status === 'redeemed' ? 'Nothing used yet' : 'Nothing expired'}
        description={
          status === 'redeemed'
            ? 'Rewards you redeem at a business will appear here.'
            : 'Rewards that pass their expiry date show up here.'
        }
      />
    )
  }

  return (
    <Stagger className="space-y-3 pt-1">
      {rewards.map((reward) => (
        <StaggerItem key={reward.id}>
          <RewardCard reward={reward} />
        </StaggerItem>
      ))}
    </Stagger>
  )
}
