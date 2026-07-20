import { useEffect, useState } from 'react'
import { Download, FileText, Link2, ScanLine } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { toast } from '@/utils/toast'
import { generateQrDataUrl, downloadDataUrl, downloadQrPdf } from '@/utils/qr'
import { useOwnerBusiness, useRecordQrDownload } from '@/features/owner/hooks/useOwner'

export function QrPage() {
  const { data: business, isLoading, isError, refetch } = useOwnerBusiness()
  const recordDownload = useRecordQrDownload()
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  const qrUrl = business?.qr?.url ?? null

  useEffect(() => {
    if (!qrUrl) return
    let active = true
    void generateQrDataUrl(qrUrl).then((url) => {
      if (active) setQrDataUrl(url)
    })
    return () => {
      active = false
    }
  }, [qrUrl])

  if (isLoading) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <Spinner size={32} label="Loading QR code" />
      </div>
    )
  }

  if (isError || !business || !business.qr) {
    return <ErrorState onRetry={() => void refetch()} />
  }

  const slug = business.slug

  function handlePng() {
    if (!qrDataUrl) return
    downloadDataUrl(qrDataUrl, `${slug}-qr.png`)
    recordDownload.mutate()
    toast.success('QR code downloaded')
  }

  async function handlePdf() {
    if (!qrDataUrl) return
    await downloadQrPdf(qrDataUrl, business!.name, `${slug}-qr-poster.pdf`)
    recordDownload.mutate()
    toast.success('Poster downloaded')
  }

  async function handleShare() {
    if (!qrUrl) return
    try {
      if (navigator.share) {
        await navigator.share({ title: business!.name, url: qrUrl })
      } else {
        await navigator.clipboard.writeText(qrUrl)
        toast.success('Link copied to clipboard')
      }
    } catch {
      /* user dismissed the share sheet — no-op */
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-title font-bold text-foreground">Your QR code</h1>
        <p className="text-caption text-text-secondary">
          Print it, place it on your counter, and let customers scan to win.
        </p>
      </div>

      <Card className="flex flex-col items-center gap-4" elevation="soft">
        <div className="rounded-2xl bg-white p-4 shadow-soft">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt={`QR code for ${business.name}`} className="size-56" width={224} height={224} />
          ) : (
            <div className="grid size-56 place-items-center">
              <Spinner size={28} />
            </div>
          )}
        </div>
        <p className="max-w-xs break-all text-center text-small text-text-muted">{qrUrl}</p>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Button size="md" leftIcon={<Download className="size-4" />} onClick={handlePng} disabled={!qrDataUrl}>
          PNG
        </Button>
        <Button size="md" variant="secondary" leftIcon={<FileText className="size-4" />} onClick={() => void handlePdf()} disabled={!qrDataUrl}>
          PDF poster
        </Button>
      </div>
      <Button fullWidth size="md" variant="outline" leftIcon={<Link2 className="size-4" />} onClick={() => void handleShare()}>
        Share link
      </Button>

      <div className="grid grid-cols-2 gap-3">
        <Card className="flex items-center gap-3" elevation="soft" padding="md">
          <span className="grid size-9 place-items-center rounded-full bg-info-soft text-info">
            <ScanLine className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-subtitle font-bold text-foreground">{business.qr.scanCount}</p>
            <p className="text-small text-text-muted">Scans</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3" elevation="soft" padding="md">
          <span className="grid size-9 place-items-center rounded-full bg-primary-soft text-primary">
            <Download className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-subtitle font-bold text-foreground">{business.qr.downloadCount}</p>
            <p className="text-small text-text-muted">Downloads</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
