import { useEffect, useState } from 'react'
import { Copy, ExternalLink, FileText, Lock, Plus, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { SegmentedControl } from '@/components/navigation/SegmentedControl'
import { StatusPill } from '@/features/admin/components/StatusPill'
import { Markdown } from '@/components/legal/Markdown'
import { toast } from '@/utils/toast'
import { useCmsPages, useDeleteCms, useUpdateCms } from '@/features/admin/hooks/useAdmin'
import type { CmsPage } from '@/features/admin/types'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'

/** Pages with a fixed public address (Play Store, footers, both apps link to these). */
const FIXED_URL: Record<string, string> = {
  privacy: ROUTES.privacy,
  terms: ROUTES.terms,
  refund: ROUTES.refund,
  'delete-account': ROUTES.deleteAccount,
}

const publicPath = (slug: string) => FIXED_URL[slug] ?? ROUTES.page(slug)

type Page = CmsPage & { core?: boolean }

/**
 * CMS pages — Privacy, Terms, Refund, Delete account, About, Contact, FAQs
 * and any page the admin adds. Written in simple Markdown; the website, the
 * customer app and the business app show them, and Google Play links to them.
 */
export function AdminCmsPage() {
  const { data, isLoading, isError, refetch } = useCmsPages()
  const [selected, setSelected] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (data && data.length > 0 && selected === null && !creating) setSelected(data[0].slug)
  }, [data, selected, creating])

  if (isLoading) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center">
        <Spinner size={32} label="Loading pages" />
      </div>
    )
  }
  if (isError || !data) return <ErrorState onRetry={() => void refetch()} />

  const pages = data as Page[]
  const page = creating ? null : (pages.find((p) => p.slug === selected) ?? pages[0])

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-title font-bold text-foreground">CMS pages</h1>
          <p className="text-caption text-text-secondary">
            Privacy, terms and info pages — shown on the website and in both apps, and linked from Google Play.
          </p>
        </div>
        <Button size="sm" leftIcon={<Plus className="size-4" />} onClick={() => setCreating(true)}>
          New page
        </Button>
      </header>

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <Card elevation="soft" padding="none" className="h-fit">
          <ul className="divide-y divide-border">
            {pages.map((p) => (
              <li key={p.slug}>
                <button
                  type="button"
                  onClick={() => {
                    setCreating(false)
                    setSelected(p.slug)
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 px-4 py-3 text-left text-caption transition-colors',
                    !creating && p.slug === page?.slug ? 'bg-primary-soft text-primary' : 'text-text-secondary hover:bg-surface-muted',
                  )}
                >
                  <FileText className="size-4 shrink-0" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{p.title}</span>
                    <span className="block truncate text-small text-text-muted">{publicPath(p.slug)}</span>
                  </span>
                  {p.status !== 'published' && <span className="text-small text-warning">Draft</span>}
                </button>
              </li>
            ))}
          </ul>
        </Card>

        {creating ? (
          <CmsEditor
            key="new"
            page={null}
            onSaved={(slug) => {
              setCreating(false)
              setSelected(slug)
            }}
            onDeleted={() => {}}
          />
        ) : (
          page && (
            <CmsEditor
              key={page.slug}
              page={page}
              onSaved={setSelected}
              onDeleted={() => setSelected(null)}
            />
          )
        )}
      </div>
    </div>
  )
}

function CmsEditor({
  page,
  onSaved,
  onDeleted,
}: {
  page: Page | null
  onSaved: (slug: string) => void
  onDeleted: () => void
}) {
  const update = useUpdateCms()
  const remove = useDeleteCms()
  const [slug, setSlug] = useState(page?.slug ?? '')
  const [title, setTitle] = useState(page?.title ?? '')
  const [body, setBody] = useState(page?.body ?? '')
  const [status, setStatus] = useState(page?.status ?? 'published')
  const [view, setView] = useState<'write' | 'preview'>('write')
  const isNew = page === null
  const url = `${window.location.origin}${publicPath(isNew ? slug || 'your-page' : page.slug)}`

  function save() {
    const target = isNew
      ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      : page.slug
    if (!target || !title.trim()) {
      toast.error('Add a title and a page link.')
      return
    }
    update.mutate(
      { slug: target, payload: { title: title.trim(), body, status } },
      {
        onSuccess: () => {
          toast.success(isNew ? 'Page created' : 'Page saved')
          onSaved(target)
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not save page.'),
      },
    )
  }

  function del() {
    if (!page || !window.confirm(`Delete “${page.title}”? Its link will stop working.`)) return
    remove.mutate(page.slug, {
      onSuccess: () => {
        toast.success('Page deleted')
        onDeleted()
      },
      onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not delete page.'),
    })
  }

  return (
    <Card elevation="soft" className="space-y-4" padding="lg">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <code className="truncate text-small text-text-muted">{url}</code>
          {!isNew && (
            <>
              <button
                type="button"
                aria-label="Copy link"
                className="text-text-muted hover:text-foreground"
                onClick={() => {
                  void navigator.clipboard?.writeText(url)
                  toast.success('Link copied')
                }}
              >
                <Copy className="size-4" />
              </button>
              <a href={url} target="_blank" rel="noreferrer" aria-label="Open page" className="text-text-muted hover:text-foreground">
                <ExternalLink className="size-4" />
              </a>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {page?.core && (
            <span className="inline-flex items-center gap-1 text-small text-text-muted" title="Linked from the apps and Google Play">
              <Lock className="size-3.5" aria-hidden /> Store page
            </span>
          )}
          <StatusPill status={status} />
        </div>
      </div>

      {isNew && (
        <div className="space-y-1.5">
          <Label htmlFor="cms-slug">Page link</Label>
          <Input id="cms-slug" value={slug} placeholder="shipping-policy" onChange={(e) => setSlug(e.target.value)} />
          <p className="text-small text-text-muted">Lowercase words with dashes. The page opens at /p/your-link.</p>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="cms-title">Title</Label>
        <Input id="cms-title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="cms-body">Content</Label>
          <SegmentedControl
            options={[
              { value: 'write', label: 'Write' },
              { value: 'preview', label: 'Preview' },
            ]}
            value={view}
            onChange={setView}
            size="sm"
            ariaLabel="Editor view"
          />
        </div>
        {view === 'write' ? (
          <>
            <Textarea
              id="cms-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={20}
              className="font-mono text-small"
            />
            <p className="text-small text-text-muted">
              <code>## Heading</code> · <code>**bold**</code> · <code>- list item</code> · <code>[link](/p/terms)</code> ·
              tables with <code>| a | b |</code>. Start with <code>**In short:** …</code> to show a summary at the top.
            </p>
          </>
        ) : (
          <div className="max-h-[60dvh] overflow-y-auto rounded-xl border border-border bg-background p-4">
            <h2 className="pb-2 text-title font-bold text-foreground">{title}</h2>
            <Markdown source={body} />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Page status"
            className="h-11 rounded-input border border-border bg-surface px-3 text-caption text-foreground"
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          {page && !page.core && (
            <Button variant="ghost" size="md" leftIcon={<Trash2 className="size-4" />} onClick={del} isLoading={remove.isPending}>
              Delete
            </Button>
          )}
        </div>
        <Button size="md" onClick={save} isLoading={update.isPending}>
          {isNew ? 'Create page' : 'Save page'}
        </Button>
      </div>
    </Card>
  )
}
