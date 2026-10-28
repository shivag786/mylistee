import { Fragment, type ReactNode } from 'react'
import { ExternalLink, Phone, Reply, Copy, ImageIcon } from 'lucide-react'
import type { TemplateButton } from '../types'
import { cn } from '@/utils/cn'

interface WhatsAppPreviewProps {
  header?: string | null
  headerFormat?: string | null
  headerImageUrl?: string | null
  body: string
  footer?: string | null
  buttons?: TemplateButton[]
  /** Values for the body's {{1}}, {{2}}… (missing ones show as the blank). */
  values?: string[]
  headerValue?: string
  shopName?: string
  className?: string
}

/** Fill {{n}} with values; an empty one stays visible as a blank to fill. */
function fill(text: string, values: string[] = []): string {
  return text.replace(/\{\{\s*(\d+)\s*\}\}/g, (whole, n: string) => values[Number(n) - 1]?.trim() || whole)
}

/** WhatsApp's own formatting: *bold*, _italic_, ~strike~ — and blanks highlighted. */
function format(text: string): ReactNode[] {
  const parts = text.split(/(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~|\{\{\s*\d+\s*\}\})/g)
  return parts.map((part, i) => {
    if (/^\*[^*]+\*$/.test(part)) return <strong key={i}>{format(part.slice(1, -1))}</strong>
    if (/^_[^_]+_$/.test(part)) return <em key={i}>{part.slice(1, -1)}</em>
    if (/^~[^~]+~$/.test(part)) return <s key={i}>{part.slice(1, -1)}</s>
    if (/^\{\{\s*\d+\s*\}\}$/.test(part))
      return (
        <span key={i} className="rounded bg-amber-200/70 px-0.5 font-mono text-[0.85em] text-amber-900">
          {part}
        </span>
      )
    return <Fragment key={i}>{part}</Fragment>
  })
}

/**
 * A template as the customer will see it in WhatsApp: the chat background, the
 * message bubble with its header, text, footer and buttons. Filled blanks show
 * their values; unfilled ones are highlighted.
 */
export function WhatsAppPreview({
  header,
  headerFormat,
  headerImageUrl,
  body,
  footer,
  buttons = [],
  values,
  headerValue,
  shopName = 'Listee',
  className,
}: WhatsAppPreviewProps) {
  const time = new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })

  return (
    <div className={cn('overflow-hidden rounded-2xl border border-black/10 shadow-sm', className)}>
      <div className="flex items-center gap-2 bg-[#075E54] px-3 py-2 text-white">
        <span className="grid size-7 place-items-center rounded-full bg-white/20 text-[11px] font-bold">{shopName.slice(0, 1)}</span>
        <span className="text-[13px] font-semibold">{shopName}</span>
      </div>
      <div
        className="min-h-40 p-3"
        style={{
          backgroundColor: '#ECE5DD',
          backgroundImage: 'radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)',
          backgroundSize: '14px 14px',
        }}
      >
        <div className="max-w-[92%] text-[13px] leading-snug text-[#111B21]">
          <div className="rounded-lg rounded-tl-none bg-white p-1 shadow-sm">
            {headerFormat === 'IMAGE' &&
              (headerImageUrl ? (
                <img src={headerImageUrl} alt="" className="mb-1 aspect-[1.91/1] w-full rounded-md object-cover" />
              ) : (
                <div className="mb-1 grid aspect-[1.91/1] w-full place-items-center rounded-md bg-slate-200 text-slate-500">
                  <ImageIcon className="size-6" aria-hidden />
                </div>
              ))}
            <div className="px-1.5 pb-0.5 pt-1">
              {headerFormat === 'TEXT' && header && (
                <p className="mb-1 font-bold">{format(fill(header, headerValue ? [headerValue] : []))}</p>
              )}
              <p className="whitespace-pre-wrap break-words">{format(fill(body || ' ', values))}</p>
              {footer && <p className="mt-1 text-[11.5px] text-[#667781]">{footer}</p>}
              <p className="mt-0.5 text-right text-[10px] text-[#667781]">{time}</p>
            </div>
          </div>
          {buttons.length > 0 && (
            <div className="mt-0.5 space-y-0.5">
              {buttons.map((b, i) => (
                <div key={i} className="flex items-center justify-center gap-1.5 rounded-lg bg-white py-2 text-[13px] font-medium text-[#00A5F4] shadow-sm">
                  {b.type === 'URL' && <ExternalLink className="size-3.5" aria-hidden />}
                  {b.type === 'PHONE_NUMBER' && <Phone className="size-3.5" aria-hidden />}
                  {b.type === 'QUICK_REPLY' && <Reply className="size-3.5" aria-hidden />}
                  {b.type === 'OTP' && <Copy className="size-3.5" aria-hidden />}
                  {b.text || (b.type === 'OTP' ? 'Copy code' : 'Button')}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
