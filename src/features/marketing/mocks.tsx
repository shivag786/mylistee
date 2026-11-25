import type { ReactNode } from 'react'
import { Bell, Check, Coins, Printer, Search, Sparkles, Wifi } from 'lucide-react'
import type { GuideScreen } from './guides'

/**
 * Illustrated Listee Business screens for "Perfect Bakery" — drawn in HTML so
 * they stay crisp, light and in the site's two colours. Used on the join page
 * and beside each guide step.
 */
export function PhoneFrame({ children, className = '', title = 'Perfect Bakery' }: { children: ReactNode; className?: string; title?: string }) {
  return (
    <div className={`relative w-[260px] shrink-0 rounded-[2.4rem] border border-foreground/10 bg-foreground p-2.5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45)] ${className}`}>
      <div className="overflow-hidden rounded-[1.9rem] bg-background">
        <div className="flex items-center justify-between px-5 pb-1 pt-2.5 text-[10px] font-semibold text-foreground">
          <span>9:41</span>
          <span className="h-4 w-16 rounded-full bg-foreground" aria-hidden />
          <span className="flex items-center gap-1"><Wifi className="size-3" /> 100%</span>
        </div>
        <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
          <span className="grid size-7 place-items-center rounded-full bg-primary text-[11px] font-bold text-white">PB</span>
          <span className="text-[13px] font-bold text-foreground">{title}</span>
          <Bell className="ml-auto size-4 text-text-muted" aria-hidden />
        </div>
        <div className="h-[430px] overflow-hidden px-3.5 py-3 text-[12px] text-foreground">{children}</div>
      </div>
    </div>
  )
}

const Row = ({ l, r, strong }: { l: ReactNode; r: ReactNode; strong?: boolean }) => (
  <div className={`flex items-center justify-between py-1.5 ${strong ? 'font-bold' : ''}`}>
    <span>{l}</span>
    <span className="tabular-nums">{r}</span>
  </div>
)
const Btn = ({ children, ghost }: { children: ReactNode; ghost?: boolean }) => (
  <div className={`rounded-xl py-2.5 text-center text-[12px] font-bold ${ghost ? 'border border-border text-foreground' : 'bg-primary text-white'}`}>{children}</div>
)
const Card = ({ children, hi }: { children: ReactNode; hi?: boolean }) => (
  <div className={`rounded-xl border p-2.5 ${hi ? 'border-primary bg-primary/5' : 'border-border bg-surface'}`}>{children}</div>
)
const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl border border-border px-3 py-2">
    <p className="text-[10px] text-text-muted">{label}</p>
    <p className="font-semibold">{value}</p>
  </div>
)
const H = ({ children }: { children: ReactNode }) => <p className="mb-2 text-[15px] font-extrabold">{children}</p>

const PRODUCTS: [string, number][] = [
  ['Black Forest Cake 500g', 450],
  ['Chocolate Truffle Pastry', 80],
  ['Butter Croissant', 60],
  ['Cold Coffee', 90],
  ['Veg Puff', 30],
  ['Pineapple Pastry', 70],
]

/** A fake but convincing QR pattern (decorative). */
export function FakeQr({ size = 120 }: { size?: number }) {
  const n = 21
  const cells: boolean[] = []
  for (let i = 0; i < n * n; i++) cells.push(((i * 37) ^ (i >> 3) * 11) % 7 < 3)
  const finder = (x: number, y: number) => {
    for (const [fx, fy] of [[0, 0], [n - 7, 0], [0, n - 7]]) {
      if (x >= fx && x < fx + 7 && y >= fy && y < fy + 7) {
        const dx = x - fx
        const dy = y - fy
        return dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4)
      }
    }
    return null
  }
  return (
    <svg viewBox={`0 0 ${n} ${n}`} width={size} height={size} aria-hidden shapeRendering="crispEdges">
      <rect width={n} height={n} fill="#fff" />
      {cells.map((on, i) => {
        const x = i % n
        const y = Math.floor(i / n)
        const f = finder(x, y)
        return (f ?? on) ? <rect key={i} x={x} y={y} width={1} height={1} fill="currentColor" /> : null
      })}
    </svg>
  )
}

export function MockScreen({ screen }: { screen: GuideScreen }) {
  switch (screen) {
    case 'register':
      return (
        <div className="space-y-2.5">
          <H>Register your shop</H>
          <Field label="Mobile number" value="+91 98XXX XXX21" />
          <Field label="Shop name" value="Perfect Bakery" />
          <Field label="Category" value="Bakery" />
          <Field label="Address" value="Sadar Bazaar, Jhansi" />
          <div className="grid h-20 place-items-center rounded-xl border border-dashed border-border text-text-muted">📍 Pin on map</div>
          <Btn>Create my shop</Btn>
        </div>
      )
    case 'products':
      return (
        <div className="space-y-2">
          <H>Products</H>
          <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-text-muted"><Search className="size-3.5" /> Search products</div>
          <Btn><Sparkles className="mr-1 inline size-3.5" />Scan menu with AI</Btn>
          {PRODUCTS.map(([n, p]) => (
            <div key={n} className="flex items-center gap-2.5 border-b border-border py-1.5">
              <span className="grid size-8 place-items-center rounded-lg bg-surface-muted text-[14px]">🍰</span>
              <span className="flex-1 font-semibold">{n}</span>
              <span className="tabular-nums">₹{p}</span>
            </div>
          ))}
        </div>
      )
    case 'menuScan':
      return (
        <div className="space-y-2">
          <H>Scan menu with AI</H>
          <div className="relative h-28 overflow-hidden rounded-xl border border-border bg-surface-muted p-2 font-mono text-[9px] leading-4 text-text-muted">
            PERFECT BAKERY — MENU<br />Black Forest 500g ....... 450<br />Truffle Pastry ............ 80<br />Croissant ................. 60<br />Cold Coffee ............... 90
            <div className="absolute inset-x-0 top-1/2 h-0.5 animate-pulse bg-primary" />
          </div>
          <p className="font-semibold text-primary">✓ Found 24 items</p>
          {PRODUCTS.slice(0, 4).map(([n, p]) => (
            <div key={n} className="flex items-center gap-2 py-1"><Check className="size-3.5 text-primary" /><span className="flex-1">{n}</span><span>₹{p}</span></div>
          ))}
          <Btn>Save all 24</Btn>
        </div>
      )
    case 'productForm':
      return (
        <div className="space-y-2.5">
          <H>Add product</H>
          <div className="grid h-24 place-items-center rounded-xl bg-surface-muted text-[34px]">🍫</div>
          <Field label="Name" value="Chocolate Truffle Pastry" />
          <div className="grid grid-cols-2 gap-2"><Field label="Price" value="₹80" /><Field label="Category" value="Pastries" /></div>
          <Card><Row l="Add-on: Extra cream" r="+₹20" /></Card>
          <Card><Row l="In stock" r={<span className="inline-block h-4 w-7 rounded-full bg-primary" />} /></Card>
          <Btn>Save product</Btn>
        </div>
      )
    case 'combo':
      return (
        <div className="space-y-2.5">
          <H>New combo</H>
          <Card hi><Row l="✓ Chocolate Truffle Pastry" r="₹80" /></Card>
          <Card hi><Row l="✓ Cold Coffee" r="₹90" /></Card>
          <Card><Row l="Butter Croissant" r="₹60" /></Card>
          <Field label="Combo name" value="Pastry + Coffee" />
          <Field label="Combo price" value="₹149" />
          <p className="rounded-lg bg-primary/10 px-3 py-2 font-semibold text-primary">Customers save ₹21</p>
          <Btn>Save combo</Btn>
        </div>
      )
    case 'orders':
      return (
        <div className="space-y-2">
          <H>Orders</H>
          <div className="flex gap-1.5 text-[10px] font-semibold">
            {['New 2', 'Preparing 3', 'Ready 1', 'Completed'].map((t, i) => (
              <span key={t} className={`rounded-full px-2 py-1 ${i === 0 ? 'bg-primary text-white' : 'bg-surface-muted'}`}>{t}</span>
            ))}
          </div>
          <Card hi>
            <Row l={<b>#42 · Table 4</b>} r={<b>₹229</b>} />
            <p className="text-text-muted">2 × Truffle Pastry, 1 × Cold Coffee</p>
            <div className="mt-2 grid grid-cols-2 gap-2"><Btn ghost>Reject</Btn><Btn>Accept</Btn></div>
          </Card>
          <Card>
            <Row l={<b>#41 · Takeaway</b>} r={<b>₹450</b>} />
            <p className="text-text-muted">1 × Black Forest Cake 500g · “Happy Birthday Riya”</p>
          </Card>
          <Card><Row l={<b>#40 · Online · Paid</b>} r={<b>₹180</b>} /><p className="text-text-muted">Preparing</p></Card>
        </div>
      )
    case 'orderDetail':
      return (
        <div className="space-y-2.5">
          <H>Order #42 · Table 4</H>
          <div className="flex items-center gap-1 text-[10px] font-semibold">
            {['Accepted', 'Preparing', 'Ready', 'Paid'].map((s, i) => (
              <span key={s} className="flex flex-1 flex-col items-center gap-1">
                <span className={`grid size-5 place-items-center rounded-full ${i < 2 ? 'bg-primary text-white' : 'bg-surface-muted'}`}>{i < 2 ? '✓' : i + 1}</span>{s}
              </span>
            ))}
          </div>
          <Card>
            <Row l="2 × Truffle Pastry" r="₹160" />
            <Row l="1 × Cold Coffee" r="₹90" />
            <Row l="Coupon" r="−₹21" />
            <Row l="Total" r="₹229" strong />
          </Card>
          <div className="grid grid-cols-2 gap-2"><Btn ghost>Print kitchen ticket</Btn><Btn>Mark ready</Btn></div>
          <p className="font-semibold">Collect ₹229</p>
          <div className="grid grid-cols-3 gap-1.5 text-center font-semibold">
            {['Cash', 'UPI', 'Card'].map((p, i) => <span key={p} className={`rounded-lg border py-2 ${i === 1 ? 'border-primary text-primary' : 'border-border'}`}>{p}</span>)}
          </div>
        </div>
      )
    case 'pos':
      return (
        <div className="space-y-2">
          <H>POS · New bill</H>
          <div className="grid grid-cols-2 gap-1.5">
            {PRODUCTS.slice(1, 5).map(([n, p], i) => (
              <div key={n} className={`rounded-xl border p-2 ${i < 2 ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <p className="line-clamp-1 font-semibold">{n}</p>
                <p className="text-text-muted">₹{p}{i < 2 && <b className="float-right text-primary">×{i + 1}</b>}</p>
              </div>
            ))}
          </div>
          <Card>
            <Row l="Subtotal" r="₹200" />
            <Row l="CGST 2.5%" r="₹5" />
            <Row l="SGST 2.5%" r="₹5" />
            <Row l="Total" r="₹210" strong />
          </Card>
          <div className="grid grid-cols-2 gap-2"><Btn ghost>Send to kitchen</Btn><Btn><Printer className="mr-1 inline size-3.5" />Print bill</Btn></div>
        </div>
      )
    case 'printer':
      return (
        <div className="space-y-2.5">
          <H>Receipt printer</H>
          <div className="grid grid-cols-3 rounded-xl border border-border text-center font-semibold">
            <span className="py-2">Bluetooth</span><span className="rounded-xl bg-primary py-2 text-white">Wi-Fi</span><span className="py-2">Off</span>
          </div>
          <Card><Row l={<span className="flex items-center gap-1.5"><Wifi className="size-3.5 text-primary" />Connected to PerfectBakery_WiFi</span>} r="" /></Card>
          <p className="font-bold">Printers on this Wi-Fi</p>
          <Card hi><Row l="🖨️ Printer at 192.168.1.50" r={<Check className="size-4 text-primary" />} /></Card>
          <Card><Row l="58 mm · 80 mm" r="80 mm" /></Card>
          <Btn>Print a test page</Btn>
        </div>
      )
    case 'notify':
      return (
        <div className="space-y-2.5">
          <H>Notify customers</H>
          <Card><Row l="You can reach this month" r={<b>1,240</b>} /></Card>
          <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold">
            {['Followers', 'Ordered from you', 'Not ordered in 30 days', 'Birthdays this week'].map((t, i) => (
              <span key={t} className={`rounded-full px-2 py-1 ${i === 0 ? 'bg-primary text-white' : 'bg-surface-muted'}`}>{t}</span>
            ))}
          </div>
          <Field label="Title" value="Fresh pastries 20% off 🍰" />
          <Field label="Message" value="Till 9 pm today at Perfect Bakery" />
          <div className="rounded-xl bg-foreground p-2.5 text-background">
            <p className="text-[10px] opacity-70">Listee · now</p>
            <p className="font-bold">Perfect Bakery: Fresh pastries 20% off 🍰</p>
          </div>
          <Btn>Send now</Btn>
        </div>
      )
    case 'qr':
      return (
        <div className="space-y-3 text-center">
          <H>QR code</H>
          <div className="mx-auto w-fit rounded-2xl border border-border bg-white p-3 text-foreground"><FakeQr size={150} /></div>
          <p className="font-bold">Scan · Spin · Win</p>
          <p className="text-text-muted">1,284 scans this month</p>
          <Btn>Print poster</Btn>
          <Btn ghost>Share shop link</Btn>
        </div>
      )
    case 'spin':
      return (
        <div className="space-y-3 text-center">
          <H>Spin rewards</H>
          <div className="relative mx-auto size-40">
            <div
              className="size-40 animate-[spin_9s_linear_infinite] rounded-full border-4 border-foreground"
              style={{ background: 'repeating-conic-gradient(var(--color-primary) 0 45deg, var(--color-background) 45deg 90deg)' }}
            />
            <span className="absolute left-1/2 top-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-foreground text-[10px] font-bold text-background">SPIN</span>
          </div>
          <Card><Row l="₹10 off" r="40%" /><Row l="Free topping" r="20%" /><Row l="Better luck" r="40%" /></Card>
        </div>
      )
    case 'loyalty':
      return (
        <div className="space-y-3">
          <H>Loyalty coins</H>
          <div className="rounded-2xl bg-foreground p-4 text-background">
            <Coins className="size-6" />
            <p className="mt-2 text-[22px] font-extrabold">120 coins</p>
            <p className="opacity-70">Riya · = ₹12 off next bill</p>
          </div>
          <Card><Row l="Earn per ₹100" r="10 coins" /><Row l="Coin value" r="₹0.10" /></Card>
        </div>
      )
    case 'dayClose':
      return (
        <div className="space-y-2">
          <H>Day report · Today</H>
          <div className="grid grid-cols-2 gap-2">
            <Card><p className="text-text-muted">Net sales</p><p className="text-[18px] font-extrabold">₹18,420</p></Card>
            <Card><p className="text-text-muted">Bills</p><p className="text-[18px] font-extrabold">96</p></Card>
          </div>
          <Card><Row l="Cash" r="₹7,950" /><Row l="UPI" r="₹9,870" /><Row l="Card" r="₹600" /></Card>
          <Card><Row l="Expected in drawer" r="₹8,950" /><Row l="Counted" r="₹8,900" strong /><Row l="Short" r="₹50" /></Card>
          <Btn>Close day</Btn>
        </div>
      )
  }
}

/** Live-looking order feed for the hero: new orders slide in one by one. */
export const HERO_ORDERS: [string, string, string][] = [
  ['#58', 'Table 2 · 2 × Veg Puff', '₹60'],
  ['#57', 'Online · Black Forest Cake', '₹450'],
  ['#56', 'Takeaway · Cold Coffee', '₹90'],
  ['#55', 'Table 5 · Pastry + Coffee combo', '₹149'],
]

