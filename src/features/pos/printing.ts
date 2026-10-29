/**
 * Receipt printing for the shop: a bill or a kitchen ticket (KOT) from an
 * order, sent either through the browser's print dialog — any printer the
 * computer knows, USB, Wi-Fi or Bluetooth — or straight to a Bluetooth (BLE)
 * thermal printer as ESC/POS bytes, where the browser supports Web Bluetooth
 * (Chrome on Android, Windows, Mac).
 *
 * Printer choices live on this device only (localStorage).
 */
import type { Order } from '@/features/owner/orderTypes'

export type PaperWidth = 58 | 80
export type PrintMode = 'browser' | 'bluetooth'

export interface PrinterSettings {
  mode: PrintMode
  paper: PaperWidth
  /** Print the bill on its own as soon as a POS order is saved. */
  autoPrint: boolean
  /** Also print a kitchen ticket. */
  kot: boolean
  footer: string
}

export interface ShopInfo {
  name: string
  address?: string | null
  phone?: string | null
}

const KEY = 'listee.printer.v1'

export const DEFAULT_PRINTER: PrinterSettings = {
  mode: 'browser',
  paper: 58,
  autoPrint: false,
  kot: false,
  footer: 'Thank you! Visit again 🙏',
}

export function loadPrinter(): PrinterSettings {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...DEFAULT_PRINTER, ...(JSON.parse(raw) as Partial<PrinterSettings>) } : DEFAULT_PRINTER
  } catch {
    return DEFAULT_PRINTER
  }
}

export function savePrinter(settings: PrinterSettings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings))
  } catch {
    // Private mode: settings last for this visit only.
  }
}

/* --------------------------------------------------------- the content -- */

type Line =
  | { kind: 'center'; text: string; big?: boolean; bold?: boolean }
  | { kind: 'row'; left: string; right: string; bold?: boolean }
  | { kind: 'text'; text: string; bold?: boolean }
  | { kind: 'rule' }
  | { kind: 'gap' }

const rupees = (n: number) => `Rs ${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}`

function when(order: Order): string {
  const iso = order.placedAt ?? order.createdAt
  const d = iso ? new Date(iso) : new Date()
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/** The customer's bill, top to bottom. */
export function billLines(order: Order, shop: ShopInfo, footer: string): Line[] {
  const lines: Line[] = [
    { kind: 'center', text: shop.name, big: true, bold: true },
  ]
  if (shop.address) lines.push({ kind: 'center', text: shop.address })
  if (shop.phone) lines.push({ kind: 'center', text: `Ph: ${shop.phone}` })
  lines.push(
    { kind: 'rule' },
    { kind: 'row', left: `Bill #${order.token}`, right: when(order) },
    { kind: 'text', text: [order.serviceLabel, order.tableLabel && `Table ${order.tableLabel}`].filter(Boolean).join(' · ') },
  )
  if (order.customerName) lines.push({ kind: 'text', text: `Customer: ${order.customerName}` })
  if (order.deliveryPhone) lines.push({ kind: 'text', text: `Mobile: ${order.deliveryPhone}` })
  lines.push({ kind: 'rule' })
  for (const item of order.items) {
    lines.push({ kind: 'row', left: `${item.quantity} x ${item.name}`, right: rupees(item.lineTotal) })
    if (item.addons?.length) lines.push({ kind: 'text', text: `   + ${item.addons.join(', ')}` })
  }
  lines.push({ kind: 'rule' }, { kind: 'row', left: 'Subtotal', right: rupees(order.subtotal) })
  if (order.billDiscount) lines.push({ kind: 'row', left: 'Shop discount', right: `-${rupees(order.billDiscount)}` })
  if (order.couponDiscount) lines.push({ kind: 'row', left: `Coupon ${order.couponCode ?? ''}`.trim(), right: `-${rupees(order.couponDiscount)}` })
  if (order.coinDiscount) lines.push({ kind: 'row', left: 'Coins', right: `-${rupees(order.coinDiscount)}` })
  if (order.deliveryFee) lines.push({ kind: 'row', left: 'Delivery', right: rupees(order.deliveryFee) })
  lines.push(
    { kind: 'row', left: 'TOTAL', right: rupees(order.total), bold: true },
    { kind: 'text', text: order.paymentLabel ? `Paid: ${order.paymentLabel}` : order.status === 'paid' || order.status === 'completed' ? 'Paid' : 'Payment due' },
    { kind: 'rule' },
  )
  if (footer.trim()) lines.push({ kind: 'center', text: footer.trim() })
  lines.push({ kind: 'center', text: 'Powered by Listee' }, { kind: 'gap' })
  return lines
}

/** The kitchen's ticket: token, how it's served, items and the note — no prices. */
export function kotLines(order: Order): Line[] {
  const lines: Line[] = [
    { kind: 'center', text: 'KITCHEN', bold: true },
    { kind: 'center', text: `#${order.token}`, big: true, bold: true },
    { kind: 'center', text: [order.serviceLabel, order.tableLabel && `Table ${order.tableLabel}`].filter(Boolean).join(' · ') },
    { kind: 'center', text: when(order) },
    { kind: 'rule' },
  ]
  for (const item of order.items) {
    lines.push({ kind: 'text', text: `${item.quantity} x ${item.name}`, bold: true })
    if (item.addons?.length) lines.push({ kind: 'text', text: `   + ${item.addons.join(', ')}` })
  }
  if (order.note) lines.push({ kind: 'rule' }, { kind: 'text', text: `Note: ${order.note}`, bold: true })
  lines.push({ kind: 'gap' })
  return lines
}

/* ---------------------------------------------------- browser printing -- */

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

function receiptHtml(pages: Line[][], paper: PaperWidth): string {
  const body = pages
    .map(
      (lines) =>
        `<section>${lines
          .map((l) => {
            switch (l.kind) {
              case 'center':
                return `<p class="c${l.big ? ' big' : ''}${l.bold ? ' b' : ''}">${esc(l.text)}</p>`
              case 'row':
                return `<p class="row${l.bold ? ' b' : ''}"><span>${esc(l.left)}</span><span>${esc(l.right)}</span></p>`
              case 'text':
                return `<p class="${l.bold ? 'b' : ''}">${esc(l.text)}</p>`
              case 'rule':
                return '<hr>'
              case 'gap':
                return '<p>&nbsp;</p>'
            }
          })
          .join('')}</section>`,
    )
    .join('')
  const width = paper === 80 ? '72mm' : '48mm'
  return `<!doctype html><html><head><meta charset="utf-8"><title>Bill</title><style>
@page { size: ${paper}mm auto; margin: 0 }
* { box-sizing: border-box }
body { margin: 0; font: 12px/1.35 ui-monospace, Menlo, Consolas, monospace; color: #000 }
section { width: ${width}; margin: 0 auto; padding: 2mm 0; page-break-after: always }
section:last-child { page-break-after: auto }
p { margin: 0; word-break: break-word }
.c { text-align: center } .b { font-weight: 700 } .big { font-size: 17px }
.row { display: flex; justify-content: space-between; gap: 6px } .row span:last-child { white-space: nowrap }
hr { border: 0; border-top: 1px dashed #000; margin: 4px 0 }
</style></head><body>${body}</body></html>`
}

/** Opens the print dialog with the receipts, in a hidden frame. */
export function printInBrowser(pages: Line[][], paper: PaperWidth): void {
  const frame = document.createElement('iframe')
  frame.setAttribute('aria-hidden', 'true')
  Object.assign(frame.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' })
  document.body.appendChild(frame)
  const doc = frame.contentDocument
  if (!doc) return
  doc.open()
  doc.write(receiptHtml(pages, paper))
  doc.close()
  const done = () => setTimeout(() => frame.remove(), 1000)
  frame.contentWindow?.addEventListener('afterprint', done)
  setTimeout(() => {
    frame.contentWindow?.focus()
    frame.contentWindow?.print()
    done()
  }, 150)
}

/* ------------------------------------------------- ESC/POS + Bluetooth -- */

/** ESC/POS bytes for the lines; non-ASCII is dropped (cheap printers lack it). */
export function escPos(pages: Line[][], paper: PaperWidth): Uint8Array {
  const cols = paper === 80 ? 48 : 32
  const out: number[] = []
  const ascii = (s: string) => s.replace(/₹/g, 'Rs').replace(/[^\x20-\x7e]/g, '')
  const write = (s: string) => {
    for (const ch of ascii(s)) out.push(ch.charCodeAt(0))
    out.push(0x0a)
  }
  const cmd = (...b: number[]) => out.push(...b)
  const wrap = (s: string, width: number) => {
    const text = ascii(s)
    const parts: string[] = []
    for (let i = 0; i < text.length; i += width) parts.push(text.slice(i, i + width))
    return parts.length ? parts : ['']
  }

  cmd(0x1b, 0x40) // initialise
  for (const lines of pages) {
    for (const l of lines) {
      cmd(0x1b, 0x45, 'bold' in l && l.bold ? 1 : 0)
      switch (l.kind) {
        case 'center':
          cmd(0x1b, 0x61, 1)
          cmd(0x1d, 0x21, l.big ? 0x11 : 0x00)
          for (const part of wrap(l.text, l.big ? cols / 2 : cols)) write(part)
          cmd(0x1d, 0x21, 0x00)
          cmd(0x1b, 0x61, 0)
          break
        case 'row': {
          const right = ascii(l.right)
          const room = Math.max(4, cols - right.length - 1)
          const left = wrap(l.left, room)
          left.forEach((part, i) => write(i === left.length - 1 ? part.padEnd(cols - right.length) + right : part))
          break
        }
        case 'text':
          for (const part of wrap(l.text, cols)) write(part)
          break
        case 'rule':
          write('-'.repeat(cols))
          break
        case 'gap':
          write('')
          break
      }
    }
    cmd(0x1b, 0x45, 0)
    cmd(0x1b, 0x64, 3) // feed 3 lines
    cmd(0x1d, 0x56, 0x42, 0x00) // cut (ignored by printers without a cutter)
  }
  return new Uint8Array(out)
}

/** Services common BLE receipt printers expose a write characteristic on. */
const PRINTER_SERVICES = [
  0x18f0,
  0xff00,
  0xffe0,
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
]

interface BleWriter {
  name: string
  write: (bytes: Uint8Array) => Promise<void>
}

let connected: BleWriter | null = null

export function bluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator
}

export function connectedPrinterName(): string | null {
  return connected?.name ?? null
}

/** Asks the browser to pick a nearby BLE printer and keeps it for this visit. */
export async function connectBluetoothPrinter(): Promise<string> {
  // Web Bluetooth types are not in the default DOM lib.
  const bt = (navigator as unknown as { bluetooth: { requestDevice: (o: unknown) => Promise<any> } }).bluetooth // eslint-disable-line @typescript-eslint/no-explicit-any
  const device = await bt.requestDevice({ acceptAllDevices: true, optionalServices: PRINTER_SERVICES })
  const server = await device.gatt.connect()
  for (const uuid of PRINTER_SERVICES) {
    try {
      const service = await server.getPrimaryService(uuid)
      for (const ch of await service.getCharacteristics()) {
        if (ch.properties.write || ch.properties.writeWithoutResponse) {
          connected = {
            name: device.name || 'Bluetooth printer',
            write: async (bytes) => {
              // Small chunks: most printers take 20–180 bytes per write.
              for (let i = 0; i < bytes.length; i += 100) {
                const chunk = bytes.slice(i, i + 100)
                if (ch.properties.writeWithoutResponse) await ch.writeValueWithoutResponse(chunk)
                else await ch.writeValue(chunk)
              }
            },
          }
          device.addEventListener('gattserverdisconnected', () => {
            connected = null
          })
          return connected.name
        }
      }
    } catch {
      // Not this service; try the next.
    }
  }
  server.disconnect()
  throw new Error('This printer did not offer a way to print. Use “Browser print” instead.')
}

/** Prints with the device's chosen method. Throws with a message to show. */
export async function printPages(pages: Line[][], settings: PrinterSettings): Promise<void> {
  if (settings.mode === 'bluetooth') {
    if (!connected) throw new Error('Connect your Bluetooth printer first (POS → Printer).')
    await connected.write(escPos(pages, settings.paper))
    return
  }
  printInBrowser(pages, settings.paper)
}

/** The bill (and KOT when switched on) for one order. */
export function orderPages(order: Order, shop: ShopInfo, settings: PrinterSettings, what: 'bill' | 'kot' | 'both' = 'bill'): Line[][] {
  const pages: Line[][] = []
  if (what !== 'kot') pages.push(billLines(order, shop, settings.footer))
  if (what === 'kot' || (what === 'both' && settings.kot)) pages.push(kotLines(order))
  return pages
}
