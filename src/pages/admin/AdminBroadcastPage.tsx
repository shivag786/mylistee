import { useState } from 'react'
import { Megaphone, Send } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/utils/toast'
import { useBroadcast } from '@/features/admin/hooks/useAdmin'

const TARGETS = [
  { value: 'all', label: 'Everyone' },
  { value: 'customers', label: 'Customers only' },
  { value: 'owners', label: 'Business owners only' },
]

export function AdminBroadcastPage() {
  const broadcast = useBroadcast()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [target, setTarget] = useState('all')
  const [link, setLink] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('A title is required.')
      return
    }
    broadcast.mutate(
      { title: title.trim(), body: body.trim() || undefined, target, link: link.trim() || undefined },
      {
        onSuccess: (res) => {
          toast.success(`Sent to ${res.sent} ${res.sent === 1 ? 'recipient' : 'recipients'}.`)
          setTitle('')
          setBody('')
          setLink('')
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Broadcast failed.'),
      },
    )
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-title font-bold text-foreground">Broadcast</h1>
        <p className="text-caption text-text-secondary">Send an in-app notification to an audience</p>
      </header>

      <Card elevation="soft" className="max-w-xl" padding="lg">
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="bc-title">Title</Label>
            <Input id="bc-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New rewards near you!" maxLength={120} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bc-body">Message</Label>
            <Textarea id="bc-body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Optional details…" rows={3} maxLength={500} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bc-target">Audience</Label>
            <select
              id="bc-target"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="h-[52px] w-full rounded-input border border-border bg-surface px-3 text-body text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              {TARGETS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bc-link">Deep link (optional)</Label>
            <Input id="bc-link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="/nearby" maxLength={255} />
          </div>

          <div className="flex items-center gap-2 rounded-md bg-info-soft px-3 py-2 text-small text-info">
            <Megaphone className="size-4 shrink-0" aria-hidden />
            Delivered as an in-app notification (push where enabled).
          </div>

          <Button type="submit" isLoading={broadcast.isPending} leftIcon={<Send className="size-4" />} fullWidth>
            Send broadcast
          </Button>
        </form>
      </Card>
    </div>
  )
}
