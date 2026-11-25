import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { CheckCircle2, Send } from 'lucide-react'
import { apiClient } from '@/services/apiClient'
import { ApiError } from '@/types/api'

const TOPICS: [string, string][] = [
  ['shop', 'I want Listee for my shop'],
  ['partner', 'I want to join as a partner / refer shops'],
  ['support', 'I already use Listee and need help'],
  ['other', 'Something else'],
]

const input = 'h-12 w-full rounded-xl border border-border bg-background px-4 text-body text-foreground outline-none transition focus:border-foreground focus:ring-2 focus:ring-foreground/10'

/** "Call me back" form → POST /enquiries; the Listee team sees it in Admin → Enquiries. */
export function EnquiryForm({ city, defaultTopic = 'shop', compact = false }: { city?: string; defaultTopic?: string; compact?: boolean }) {
  const location = useLocation()
  const [f, setF] = useState({ name: '', phone: '', city: city ?? '', businessName: '', businessType: '', topic: defaultTopic, message: '', website: '' })
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((o) => ({ ...o, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (f.name.trim().length < 2 || f.phone.replace(/\D/g, '').length < 10) {
      setError('Please enter your name and a 10-digit mobile number.')
      return
    }
    setSending(true)
    try {
      await apiClient.post('enquiries', { ...f, source: location.pathname }, { auth: false })
      setDone('Thank you! Our team will call you within one working day.')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send. Please try again or WhatsApp us.')
    } finally {
      setSending(false)
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-border bg-surface p-8 text-center">
        <CheckCircle2 className="size-12 text-primary" aria-hidden />
        <p className="text-lg font-bold">{done}</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-3xl border border-border bg-surface p-5 shadow-sm md:p-7" noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={input} placeholder="Your name *" value={f.name} onChange={set('name')} autoComplete="name" aria-label="Your name" />
        <input className={input} placeholder="Mobile number *" value={f.phone} onChange={set('phone')} inputMode="tel" autoComplete="tel" aria-label="Mobile number" />
        {!compact && <input className={input} placeholder="Shop name" value={f.businessName} onChange={set('businessName')} aria-label="Shop name" />}
        <input className={input} placeholder="City / town / village" value={f.city} onChange={set('city')} aria-label="City" />
      </div>
      <select className={input} value={f.topic} onChange={set('topic')} aria-label="What do you need">
        {TOPICS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      {!compact && <textarea className={`${input} h-24 py-3`} placeholder="Your question (optional)" value={f.message} onChange={set('message')} aria-label="Message" />}
      {/* Honeypot: hidden from people, bots fill it. */}
      <input className="hidden" tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} aria-hidden />
      {error && <p className="text-small text-destructive">{error}</p>}
      <button type="submit" disabled={sending} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-foreground font-semibold text-background transition hover:opacity-90 disabled:opacity-60">
        <Send className="size-4" aria-hidden /> {sending ? 'Sending…' : 'Request a call back'}
      </button>
      <p className="text-center text-small text-text-muted">Free demo · No obligation · Hindi or English</p>
    </form>
  )
}
