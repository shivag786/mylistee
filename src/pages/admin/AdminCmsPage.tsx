import { useEffect, useState } from 'react'
import { FileText } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { StatusPill } from '@/features/admin/components/StatusPill'
import { toast } from '@/utils/toast'
import { useCmsPages, useUpdateCms } from '@/features/admin/hooks/useAdmin'
import type { CmsPage } from '@/features/admin/types'
import { cn } from '@/utils/cn'

export function AdminCmsPage() {
  const { data, isLoading, isError, refetch } = useCmsPages()
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    if (data && data.length > 0 && selected === null) setSelected(data[0].slug)
  }, [data, selected])

  if (isLoading) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center">
        <Spinner size={32} label="Loading pages" />
      </div>
    )
  }
  if (isError || !data) return <ErrorState onRetry={() => void refetch()} />

  const page = data.find((p) => p.slug === selected) ?? data[0]

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-title font-bold text-foreground">CMS pages</h1>
        <p className="text-caption text-text-secondary">Edit your legal and info pages</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <Card elevation="soft" padding="none" className="h-fit">
          <ul className="divide-y divide-border">
            {data.map((p) => (
              <li key={p.slug}>
                <button
                  type="button"
                  onClick={() => setSelected(p.slug)}
                  className={cn(
                    'flex w-full items-center gap-2 px-4 py-3 text-left text-caption transition-colors',
                    p.slug === page?.slug ? 'bg-primary-soft text-primary' : 'text-text-secondary hover:bg-surface-muted',
                  )}
                >
                  <FileText className="size-4 shrink-0" aria-hidden />
                  <span className="flex-1 font-medium">{p.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        {page && <CmsEditor key={page.slug} page={page} />}
      </div>
    </div>
  )
}

function CmsEditor({ page }: { page: CmsPage }) {
  const update = useUpdateCms()
  const [title, setTitle] = useState(page.title)
  const [body, setBody] = useState(page.body ?? '')
  const [status, setStatus] = useState(page.status)

  function save() {
    update.mutate(
      { slug: page.slug, payload: { title, body, status } },
      {
        onSuccess: () => toast.success('Page saved'),
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not save page.'),
      },
    )
  }

  return (
    <Card elevation="soft" className="space-y-4" padding="lg">
      <div className="flex items-center justify-between">
        <code className="text-small text-text-muted">/{page.slug}</code>
        <StatusPill status={status} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cms-title">Title</Label>
        <Input id="cms-title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cms-body">Body</Label>
        <Textarea id="cms-body" value={body} onChange={(e) => setBody(e.target.value)} rows={12} />
      </div>

      <div className="flex items-center justify-between gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Page status"
          className="h-11 rounded-input border border-border bg-surface px-3 text-caption text-foreground"
        >
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <Button size="md" onClick={save} isLoading={update.isPending}>
          Save page
        </Button>
      </div>
    </Card>
  )
}
