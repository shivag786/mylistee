/**
 * Client-side QR generation + export (document/phase/07 §QR Download). The QR
 * encodes the permanent public profile URL supplied by the backend; nothing
 * about it is generated server-side.
 */
import QRCode from 'qrcode'

const QR_DARK = '#1E1E1E'
const QR_LIGHT = '#FFFFFF'

/** Render a QR for `text` as a PNG data URL. */
export async function generateQrDataUrl(text: string, size = 640): Promise<string> {
  return QRCode.toDataURL(text, {
    width: size,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: { dark: QR_DARK, light: QR_LIGHT },
  })
}

/** Trigger a browser download of a data URL. */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
}

/**
 * Build and download a printable A4 poster: business name, a "Scan to win
 * rewards" prompt, and the QR centered on the page.
 */
export async function downloadQrPdf(
  qrDataUrl: string,
  businessName: string,
  filename: string,
): Promise<void> {
  // Lazy-loaded so jsPDF (large) stays out of the main bundle until needed.
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.text(businessName, pageWidth / 2, 110, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(16)
  doc.setTextColor(107, 114, 128)
  doc.text('Scan to spin & win rewards', pageWidth / 2, 140, { align: 'center' })

  const qrSize = 320
  const qrX = (pageWidth - qrSize) / 2
  doc.addImage(qrDataUrl, 'PNG', qrX, 190, qrSize, qrSize)

  doc.setFontSize(12)
  doc.text('Powered by Listee', pageWidth / 2, 560, { align: 'center' })

  doc.save(filename)
}
