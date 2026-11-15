import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { apiClient } from '@/services/apiClient'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { ROUTES } from '@/constants/routes'
import { toast } from '@/utils/toast'

/**
 * Delete my account — closes it at once and wipes the personal details (see
 * the public Delete account page for what is kept and why). For an owner it
 * also takes the shop off Listee.
 */
export function DeleteAccountCard({ owner = false }: { owner?: boolean }) {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)

  async function confirm() {
    setBusy(true)
    try {
      await apiClient.delete('account', { query: { confirm: 'DELETE' } })
      toast.success('Your account has been deleted.')
      await signOut().catch(() => undefined)
      navigate(ROUTES.home, { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete the account.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Card padding="md" className="flex flex-wrap items-center justify-between gap-3 border-danger/30">
        <div className="min-w-0">
          <p className="text-body font-semibold text-foreground">Delete account</p>
          <p className="text-caption text-text-secondary">
            {owner
              ? 'Closes your login and takes your shop off Listee.'
              : 'Closes your account and removes your personal details.'}{' '}
            <a href={ROUTES.deleteAccount} className="text-primary underline">
              What happens
            </a>
          </p>
        </div>
        <Button variant="outline" size="sm" leftIcon={<Trash2 className="size-4" />} onClick={() => setOpen(true)}>
          Delete account
        </Button>
      </Card>

      <Dialog open={open} onOpenChange={(v) => !busy && setOpen(v)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
          </DialogHeader>
          <p className="text-caption text-text-secondary">
            This cannot be undone. Your name, mobile, email and profile are removed now
            {owner ? ', your shop goes offline and staff logins stop working' : ', and unused coins and rewards are lost'}.
            Bills stay for tax records without your name.
          </p>
          <Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Type DELETE" aria-label="Type DELETE to confirm" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button
              className="bg-danger text-white hover:bg-danger/90"
              disabled={typed.trim().toUpperCase() !== 'DELETE'}
              isLoading={busy}
              onClick={() => void confirm()}
            >
              Delete forever
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
