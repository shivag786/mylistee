import { useState } from 'react'
import { Download, Store, Users, Tag, Receipt, type LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from '@/utils/toast'
import { adminService } from '@/features/admin/services/adminService'

interface ReportDef {
  type: string
  label: string
  description: string
  icon: LucideIcon
}

const REPORTS: ReportDef[] = [
  { type: 'businesses', label: 'Businesses', description: 'All businesses with owner, status and activity', icon: Store },
  { type: 'customers', label: 'Customers', description: 'All customers with spins, rewards and status', icon: Users },
  { type: 'offers', label: 'Offers', description: 'All offers with business, type and window', icon: Tag },
  { type: 'invoices', label: 'Invoices', description: 'Billing history across all businesses', icon: Receipt },
]

export function AdminReportsPage() {
  const [busy, setBusy] = useState<string | null>(null)

  async function download(type: string) {
    setBusy(type)
    try {
      await adminService.downloadReport(type)
      toast.success('Export ready')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Export failed.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-title font-bold text-foreground">Reports</h1>
        <p className="text-caption text-text-secondary">Export platform data as CSV</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {REPORTS.map(({ type, label, description, icon: Icon }) => (
          <Card key={type} elevation="soft" className="flex items-center gap-3" padding="md">
            <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
              <Icon className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">{label}</p>
              <p className="text-caption text-text-secondary">{description}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              isLoading={busy === type}
              onClick={() => void download(type)}
              leftIcon={<Download className="size-4" />}
            >
              CSV
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
