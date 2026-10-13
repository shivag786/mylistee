import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Search, Phone, Contact, MapPin, Mail, MessageSquare } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { SkeletonList } from '@/components/feedback/skeletons'
import { ConfirmationDialog } from '@/components/feedback/ConfirmationDialog'
import {
  useShopCustomers,
  useCreateShopCustomer,
  useUpdateShopCustomer,
  useDeleteShopCustomer,
} from '@/features/owner/hooks/useCustomers'
import type { ShopCustomer, ShopCustomerInput } from '@/features/owner/services/customerService'
import { usePageTitle } from '@/hooks/usePageTitle'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { MESSAGES } from '@/constants/messages'

/** "9876543210" → "98765 43210" for reading at a glance. */
function formatPhone(phone: string): string {
  return phone.length === 10 ? `${phone.slice(0, 5)} ${phone.slice(5)}` : phone
}

/**
 * The shop's own customer book: walk-in customers kept by mobile number, with
 * optional name, email and city. Customers who leave a review through the
 * review link are added here automatically.
 */
export function OwnerCustomersPage() {
  usePageTitle('Customers')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  // Debounce typing so each keystroke isn't a request.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const { data, isLoading, isError, refetch, isFetching } = useShopCustomers(search, page)
  const create = useCreateShopCustomer()
  const update = useUpdateShopCustomer()
  const del = useDeleteShopCustomer()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ShopCustomer | null>(null)
  const [deleting, setDeleting] = useState<ShopCustomer | null>(null)

  function openAdd() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(customer: ShopCustomer) {
    setEditing(customer)
    setFormOpen(true)
  }

  async function submit(input: ShopCustomerInput): Promise<Record<string, string[]> | null> {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, input })
        toast.success('Customer updated')
      } else {
        await create.mutateAsync(input)
        toast.success('Customer added')
      }
      setFormOpen(false)
      return null
    } catch (err) {
      if (err instanceof ApiError && err.errors) return err.errors
      toast.error(err instanceof ApiError ? err.message : MESSAGES.errors.generic)
      return null
    }
  }

  const customers = data?.items ?? []
  const meta = data?.meta
  const total = meta?.total ?? 0

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-title font-bold text-foreground">Customers</h1>
          <p className="text-caption text-text-secondary">
            {data && !search
              ? `${total} ${total === 1 ? 'customer' : 'customers'} in your list`
              : 'Keep your regular customers in one place'}
          </p>
        </div>
        <Button size="sm" leftIcon={<Plus className="size-4" />} onClick={openAdd}>
          Add customer
        </Button>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-text-muted" aria-hidden />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name, mobile, email or city"
          className="pl-10"
          aria-label="Search customers"
        />
      </div>

      {isLoading ? (
        <SkeletonList rows={5} />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : customers.length === 0 ? (
        search ? (
          <EmptyState
            icon={<Search className="size-7" />}
            title="No matches"
            description={`No customer matches “${search}”.`}
          />
        ) : (
          <EmptyState
            icon={<Contact className="size-7" />}
            title="No customers yet"
            description="Add customers by mobile number. People who review you through your review link are added here too."
            actionLabel="Add customer"
            onAction={openAdd}
          />
        )
      ) : (
        <Card elevation="soft" padding="none" className={isFetching ? 'opacity-70 transition-opacity' : undefined}>
          <ul className="divide-y divide-border">
            {customers.map((customer) => (
              <li key={customer.id} className="flex items-start gap-3 px-4 py-3">
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="flex flex-wrap items-center gap-2 font-medium text-foreground">
                    <span className="truncate">{customer.name ?? 'No name'}</span>
                    {customer.source === 'review' && <Badge tone="info">From review link</Badge>}
                  </p>
                  <a
                    href={`tel:+91${customer.phone}`}
                    className="inline-flex items-center gap-1.5 text-caption text-primary"
                  >
                    <Phone className="size-3.5" aria-hidden />
                    {formatPhone(customer.phone)}
                  </a>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-caption text-text-secondary">
                    {customer.email && (
                      <span className="inline-flex min-w-0 items-center gap-1">
                        <Mail className="size-3.5 shrink-0" aria-hidden />
                        <span className="truncate">{customer.email}</span>
                      </span>
                    )}
                    {customer.city && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5" aria-hidden />
                        {customer.city}
                      </span>
                    )}
                    {customer.reviewsCount > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="size-3.5" aria-hidden />
                        Reviewed you
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button size="sm" variant="ghost" aria-label={`Edit ${customer.name ?? customer.phone}`} onClick={() => openEdit(customer)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button size="sm" variant="ghost" aria-label={`Delete ${customer.name ?? customer.phone}`} onClick={() => setDeleting(customer)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {meta && meta.lastPage > 1 && (
        <div className="flex items-center justify-between gap-3">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-caption text-text-secondary">
            Page {meta.currentPage} of {meta.lastPage}
          </span>
          <Button size="sm" variant="outline" disabled={page >= meta.lastPage} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}

      <CustomerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        customer={editing}
        busy={create.isPending || update.isPending}
        onSubmit={submit}
      />

      <ConfirmationDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Remove this customer?"
        description={
          deleting
            ? `${deleting.name ?? formatPhone(deleting.phone)} will be removed from your list. Any review they left stays on your page.`
            : undefined
        }
        confirmLabel="Remove"
        destructive
        isLoading={del.isPending}
        onConfirm={() => {
          if (!deleting) return
          del.mutate(deleting.id, {
            onSuccess: () => {
              toast.success('Customer removed')
              setDeleting(null)
            },
            onError: (err) => toast.error(err instanceof ApiError ? err.message : MESSAGES.errors.generic),
          })
        }}
      />
    </div>
  )
}

function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
  busy,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: ShopCustomer | null
  busy?: boolean
  /** Resolves to the server's field errors, or null when saved. */
  onSubmit: (input: ShopCustomerInput) => Promise<Record<string, string[]> | null>
}) {
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  useEffect(() => {
    if (open) {
      setPhone(customer?.phone ?? '')
      setName(customer?.name ?? '')
      setEmail(customer?.email ?? '')
      setCity(customer?.city ?? '')
      setErrors({})
    }
  }, [open, customer])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fieldErrors = await onSubmit({
      phone: phone.trim(),
      name: name.trim(),
      email: email.trim(),
      city: city.trim(),
    })
    if (fieldErrors) setErrors(fieldErrors)
  }

  const fieldError = (key: string) =>
    errors[key]?.[0] ? <p className="text-small text-destructive">{errors[key][0]}</p> : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{customer ? 'Edit customer' : 'Add customer'}</DialogTitle>
          <DialogDescription>Only the mobile number is required.</DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
          <label className="block space-y-1">
            <span className="text-caption font-medium text-foreground">Mobile number</span>
            <Input
              type="tel"
              inputMode="tel"
              autoComplete="off"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="98765 43210"
              maxLength={16}
              aria-invalid={Boolean(errors.phone)}
              required
            />
            {fieldError('phone')}
          </label>
          <label className="block space-y-1">
            <span className="text-caption font-medium text-foreground">Name (optional)</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} aria-invalid={Boolean(errors.name)} />
            {fieldError('name')}
          </label>
          <label className="block space-y-1">
            <span className="text-caption font-medium text-foreground">Email (optional)</span>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={120}
              aria-invalid={Boolean(errors.email)}
            />
            {fieldError('email')}
          </label>
          <label className="block space-y-1">
            <span className="text-caption font-medium text-foreground">City (optional)</span>
            <Input value={city} onChange={(e) => setCity(e.target.value)} maxLength={80} aria-invalid={Boolean(errors.city)} />
            {fieldError('city')}
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" isLoading={busy} disabled={!phone.trim()}>
              {customer ? 'Save changes' : 'Add customer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
