import { useState } from 'react'
import { MoreHorizontal, Ban, ShieldX, RotateCcw, KeyRound, Copy } from 'lucide-react'
import { ConfirmationDialog } from '@/components/feedback/ConfirmationDialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { Avatar } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from '@/utils/toast'
import { AdminTable, type Column } from '@/features/admin/components/AdminTable'
import { AdminToolbar } from '@/features/admin/components/AdminToolbar'
import { Pagination } from '@/features/admin/components/Pagination'
import { StatusPill } from '@/features/admin/components/StatusPill'
import { useAdminCustomers, useResetCustomerPin, useSetCustomerStatus } from '@/features/admin/hooks/useAdmin'
import type { AdminCustomer, ListFilters } from '@/features/admin/types'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'blocked', label: 'Blocked' },
]

export function AdminCustomersPage() {
  const [filters, setFilters] = useState<ListFilters>({ page: 1 })
  const { data, isLoading } = useAdminCustomers(filters)
  const setStatus = useSetCustomerStatus()
  const resetPin = useResetCustomerPin()
  const [resetting, setResetting] = useState<AdminCustomer | null>(null)
  const [issued, setIssued] = useState<{ name: string; phone: string; pin: string } | null>(null)

  function confirmReset() {
    if (!resetting) return
    const customer = resetting
    resetPin
      .mutateAsync(customer.id)
      .then(({ pin, phone }) => {
        setResetting(null)
        setIssued({ name: customer.name, phone, pin })
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Could not reset the PIN.'))
  }

  function act(id: string, status: string, message: string) {
    setStatus
      .mutateAsync({ id, status })
      .then(() => toast.success(message))
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Action failed.'))
  }

  const columns: Column<AdminCustomer>[] = [
    {
      key: 'name',
      label: 'Customer',
      cell: (c) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={c.name} src={c.avatarUrl ?? undefined} size="sm" />
          <div className="min-w-0">
            <p className="font-medium text-foreground">{c.name}</p>
            <p className="truncate text-small text-text-muted">{c.email || c.phone || '—'}</p>
          </div>
        </div>
      ),
    },
    { key: 'status', label: 'Status', cell: (c) => <StatusPill status={c.status} /> },
    { key: 'activity', label: 'Activity', className: 'tabular-nums', cell: (c) => `${c.spins} spins · ${c.rewards} rewards` },
    {
      key: 'joined',
      label: 'Joined',
      cell: (c) => (c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'),
    },
    {
      key: 'actions',
      label: '',
      className: 'w-10 text-right',
      cell: (c) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton aria-label={`Actions for ${c.name}`} size="sm">
              <MoreHorizontal aria-hidden />
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {c.status !== 'active' && (
              <DropdownMenuItem onClick={() => act(c.id, 'active', 'Customer reactivated')}>
                <RotateCcw className="size-4" /> Restore
              </DropdownMenuItem>
            )}
            {c.status !== 'suspended' && (
              <DropdownMenuItem onClick={() => act(c.id, 'suspended', 'Customer suspended')}>
                <Ban className="size-4" /> Suspend
              </DropdownMenuItem>
            )}
            {c.status !== 'blocked' && (
              <DropdownMenuItem onClick={() => act(c.id, 'blocked', 'Customer blocked')}>
                <ShieldX className="size-4" /> Block
              </DropdownMenuItem>
            )}
            {/* Only an account with a number can sign in with a PIN at all. */}
            {c.phone && (
              <DropdownMenuItem onClick={() => setResetting(c)}>
                <KeyRound className="size-4" /> Reset PIN
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-title font-bold text-foreground">Customers</h1>

      <AdminToolbar
        search={filters.search ?? ''}
        onSearch={(search) => setFilters((f) => ({ ...f, search, page: 1 }))}
        placeholder="Search by name, email or mobile…"
        statusOptions={STATUS_OPTIONS}
        status={filters.status}
        onStatus={(status) => setFilters((f) => ({ ...f, status, page: 1 }))}
      />

      <AdminTable
        columns={columns}
        rows={data?.items ?? []}
        getRowKey={(c) => c.id}
        isLoading={isLoading}
        emptyMessage="No customers match your filters."
      />
      {data && <Pagination meta={data.meta} onPage={(page) => setFilters((f) => ({ ...f, page }))} />}

      <ConfirmationDialog
        open={resetting !== null}
        onOpenChange={(open) => !open && setResetting(null)}
        title={`Reset ${resetting?.name ?? 'this customer'}'s PIN?`}
        // With no OTP, the admin is the only check that this is really them.
        description={`Call ${resetting?.phone ?? 'their number'} first and make sure you are speaking to the account's owner. Resetting signs them out everywhere, and the new PIN is shown only once.`}
        confirmLabel="Reset PIN"
        isLoading={resetPin.isPending}
        onConfirm={confirmReset}
      />

      <IssuedPinDialog issued={issued} onClose={() => setIssued(null)} />
    </div>
  )
}

/**
 * The new PIN, shown once. Closing this is the last chance to read it -- the
 * server keeps only a hash, so there is no "show it again".
 */
function IssuedPinDialog({
  issued,
  onClose,
}: {
  issued: { name: string; phone: string; pin: string } | null
  onClose: () => void
}) {
  async function copy() {
    if (!issued) return
    try {
      await navigator.clipboard.writeText(issued.pin)
      toast.success('PIN copied')
    } catch {
      toast.error('Could not copy -- read it out instead.')
    }
  }

  return (
    <Dialog open={issued !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New PIN for {issued?.name}</DialogTitle>
          <DialogDescription>
            Read this to the customer at {issued?.phone}. It will not be shown again. Ask them to
            change it from their profile once they are in.
          </DialogDescription>
        </DialogHeader>

        <p className="rounded-xl bg-surface-muted py-4 text-center font-mono text-3xl font-bold tracking-[0.3em] text-foreground">
          {issued?.pin}
        </p>

        <div className="flex gap-2">
          <Button variant="outline" fullWidth leftIcon={<Copy className="size-4" />} onClick={() => void copy()}>
            Copy
          </Button>
          <Button fullWidth onClick={onClose}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
