/**
 * Vendor guides (/guide/:slug): step-by-step help for the Listee Business app
 * and web panel, shown on an example shop, "Perfect Bakery". Each step names
 * the real button the owner taps, and has a small mock screen beside it.
 */
export type GuideScreen =
  | 'register'
  | 'products'
  | 'menuScan'
  | 'productForm'
  | 'combo'
  | 'orders'
  | 'orderDetail'
  | 'pos'
  | 'printer'
  | 'notify'
  | 'qr'
  | 'spin'
  | 'dayClose'
  | 'loyalty'

export interface GuideStep {
  title: string
  text: string
  screen: GuideScreen
  /** A real app screenshot to show instead of the drawn screen. */
  shot?: 'shop' | 'menu'
  tip?: string
}

export interface Guide {
  slug: string
  title: string
  /** One-line answer shown first (good for AI answers and featured snippets). */
  summary: string
  minutes: number
  icon: string
  steps: GuideStep[]
  faqs: [string, string][]
}

export const GUIDES: Guide[] = [
  {
    slug: 'get-started',
    title: 'Register your shop on Listee',
    summary: 'Download Listee Business from Google Play (or open listee.org/get-started), sign up with your mobile number, add your shop name, category and location — your shop page, QR code and billing are ready in about 5 minutes.',
    minutes: 5,
    icon: 'Store',
    steps: [
      { title: 'Install Listee Business', text: 'Get “Listee Business” from Google Play, or open listee.org/get-started on any phone or computer.', screen: 'register' },
      { title: 'Sign up with your mobile number', text: 'Enter your mobile number, set a 4-digit PIN and your name. No email needed.', screen: 'register' },
      { title: 'Add your shop details', text: 'Shop name (for example “Perfect Bakery”), category (Bakery), address and the pin on the map so nearby customers find you.', screen: 'register', tip: 'Add a logo and a cover photo — shops with photos get far more scans.' },
      { title: 'You’re live', text: 'Your shop page, QR code and billing are ready. Next, add your products.', screen: 'products' },
    ],
    faqs: [
      ['How much does it cost to start?', 'Starting is free. You can bill, add products and get your QR code without paying. Paid plans unlock more offers, notifications and AI features.'],
      ['Do I need a computer?', 'No. Everything works in the Listee Business Android app. The web panel at listee.org is optional.'],
    ],
  },
  {
    slug: 'add-products',
    title: 'Add products or your menu (with AI menu scan)',
    summary: 'In Listee Business open Products → “Scan menu with AI” and take a photo of your printed menu: dishes and prices are filled in for you. Or tap Add product and enter name, price, photo and category.',
    minutes: 4,
    icon: 'Package',
    steps: [
      { title: 'Open Products', text: 'From the bottom bar tap Products. Perfect Bakery starts with categories like Cakes, Pastries and Beverages.', screen: 'products' },
      { title: 'Fastest way: Scan menu with AI', text: 'Tap “Scan menu with AI” and take a photo (or upload a PDF) of your menu card. Listee reads every item and price.', screen: 'menuScan', tip: 'Check the list, fix any price, then tap Save all — 40 items in under a minute.' },
      { title: 'Or add one product', text: 'Tap Add product: name (Chocolate Truffle Pastry), price (₹80), category (Pastries), a photo and whether it is veg.', screen: 'productForm' },
      { title: 'Add-ons and stock', text: 'Add extras like “Extra cream +₹20”, and switch an item off when it is sold out so customers can’t order it.', screen: 'productForm' },
    ],
    faqs: [
      ['Can I add products in Hindi?', 'Yes. Product names can be in Hindi, English or both.'],
      ['How many products can I add?', 'As many as you need. Photos are optional but help customers choose.'],
    ],
  },
  {
    slug: 'create-combos',
    title: 'Create combos that sell more',
    summary: 'Go to Combos → New combo, pick 2 or more products, set one combo price (lower than buying separately) and save. The combo shows on your shop page, in POS billing and can be pushed to customers.',
    minutes: 2,
    icon: 'Layers',
    steps: [
      { title: 'Open Combos → New combo', text: 'Tap Combos in the menu, then New combo.', screen: 'combo' },
      { title: 'Pick the items', text: 'Perfect Bakery picks Chocolate Pastry (₹80) + Cold Coffee (₹90).', screen: 'combo' },
      { title: 'Set the combo price', text: 'Set ₹149 instead of ₹170. Listee shows customers “Save ₹21”.', screen: 'combo', tip: 'Combos around a best-seller lift the average bill.' },
      { title: 'Go live', text: 'Save: the combo appears on your shop page, in POS billing and in your notifications — like this real combo on The Perfect Cafe & bakery.', screen: 'combo', shot: 'menu' },
    ],
    faqs: [['Can a combo run only on some days?', 'Yes. Set a start and end date, or run it only on weekends.']],
  },
  {
    slug: 'manage-orders',
    title: 'Receive and manage orders',
    summary: 'New orders ring on your phone. Open Orders, tap Accept (or Reject with a reason), mark it ready when it is done, collect payment by cash, UPI or card, and it moves to Completed. Table and online orders all arrive in the same list.',
    minutes: 3,
    icon: 'ClipboardList',
    steps: [
      { title: 'A new order rings', text: 'When a customer orders from your shop link or table QR, the phone rings — even when the app is closed.', screen: 'orders', tip: 'Allow notifications and turn off battery saver for Listee Business so the ring is never missed.' },
      { title: 'Accept or Reject', text: 'Open the order: see items, table or delivery details and notes. Tap Accept, or Reject and choose a reason the customer sees.', screen: 'orderDetail' },
      { title: 'Prepare and mark ready', text: 'Print the kitchen ticket (KOT) if you use one. When it is done, mark it ready — the customer gets a notification.', screen: 'orderDetail' },
      { title: 'Collect payment and complete', text: 'Choose how they paid — cash, UPI or card. Online-paid orders show “already paid”. The order moves to Completed and the bill can be printed.', screen: 'orderDetail' },
    ],
    faqs: [
      ['Does Listee take commission on orders?', 'Listee does not take a percentage of your order value like delivery apps do. Online payments carry only the payment gateway fee.'],
      ['Can staff take orders?', 'Yes. Add staff with their own login and permissions; you see who billed what.'],
    ],
  },
  {
    slug: 'pos-billing',
    title: 'Counter billing (POS), GST bills and printing',
    summary: 'Tap POS · New bill, tap the items, choose dine-in, takeaway or table, apply a discount if needed and tap Print bill. Switch on GST in billing settings for CGST/SGST invoices; connect a Bluetooth or Wi-Fi thermal printer in More → Printer.',
    minutes: 4,
    icon: 'Printer',
    steps: [
      { title: 'Open POS · New bill', text: 'Tap the items the customer buys. Quantities update with each tap.', screen: 'pos' },
      { title: 'Discount and payment', text: 'Add a % or ₹ discount, choose cash, UPI or card, and save.', screen: 'pos' },
      { title: 'Print the bill and KOT', text: 'Print bill, Print kitchen ticket or Print both. Auto-print can print every counter bill by itself.', screen: 'pos' },
      { title: 'Connect your printer once', text: 'More → Printer → Bluetooth (pick the paired printer) or Wi-Fi (Listee finds printers on your Wi-Fi). Choose 58 mm or 80 mm and print a test page.', screen: 'printer' },
    ],
    faqs: [
      ['Which printers work?', 'Any 58 mm or 80 mm ESC/POS thermal printer over Bluetooth or Wi-Fi/LAN.'],
      ['Can I make GST invoices?', 'Yes. Turn on GST, add your GSTIN and rates; invoices show CGST and SGST and get serial numbers.'],
    ],
  },
  {
    slug: 'notify-customers',
    title: 'Send offers and notifications to your customers',
    summary: 'Open Notify customers, choose who gets it (followers, people who ordered, customers who haven’t come in 30 days, or birthdays this week), write a short offer, and tap Send now. It reaches their phones as a notification from your shop.',
    minutes: 2,
    icon: 'BellRing',
    steps: [
      { title: 'Open Notify customers', text: 'You see how many followers and customers you can reach this month.', screen: 'notify' },
      { title: 'Pick who gets it', text: 'Followers, people who ordered, “haven’t ordered in 30 days”, or birthdays & anniversaries this week.', screen: 'notify' },
      { title: 'Write the offer', text: 'Perfect Bakery: “Fresh pastries 20% off till 9 pm 🍰”. Short and clear works best.', screen: 'notify', tip: 'Ask the AI assistant to write it for you in Hindi or English.' },
      { title: 'Send now', text: 'It arrives on their phone; tapping it opens your shop page — only your shop, with your menu and offers. You see how many got it.', screen: 'notify', shot: 'shop' },
    ],
    faqs: [['Will customers get spammed?', 'No. Listee limits how many messages a shop can send and pauses them between 10 pm and 8 am.']],
  },
  {
    slug: 'qr-poster-spin-win',
    title: 'QR poster, spin & win and loyalty',
    summary: 'Print your QR poster from QR code → Print poster and put it at the counter. Customers scan it to see your menu, spin to win rewards you set in Spin rewards, and collect loyalty coins on every bill — so they come back.',
    minutes: 3,
    icon: 'QrCode',
    steps: [
      { title: 'Print your QR poster', text: 'QR code → Print poster. Put it at the counter, door and on tables. A scan opens your shop page with your menu.', screen: 'qr' },
      { title: 'Set spin rewards', text: 'Spin rewards: add prizes like ₹10 off, free topping, 5% off — and how often each can win.', screen: 'spin' },
      { title: 'Loyalty coins', text: 'Loyalty coins: customers earn coins on every bill and use them next time.', screen: 'loyalty' },
      { title: 'Redeem at the counter', text: 'When a customer shows a reward, open Redeem and scan or enter the code.', screen: 'spin' },
    ],
    faqs: [['Why will customers scan?', 'Because every scan gives a free spin to win something. That turns a poster on the wall into a reason to visit again.']],
  },
  {
    slug: 'day-close-reports',
    title: 'Day close and sales reports',
    summary: 'At closing open Day report → Close day: see sales, payments by cash/UPI/card, discounts, cancelled orders and top items, count the cash in the drawer and print or save the report.',
    minutes: 2,
    icon: 'BarChart3',
    steps: [
      { title: 'Open Day report', text: 'Today’s bills, net sales and average bill at the top.', screen: 'dayClose' },
      { title: 'Check payments and cash', text: 'Cash, UPI and card totals, plus cash in and out of the drawer.', screen: 'dayClose' },
      { title: 'Close day', text: 'Enter the cash you counted; Listee shows short or extra. Print the report for your records.', screen: 'dayClose' },
    ],
    faqs: [['Can I see staff-wise sales?', 'Yes. The report shows what each staff member billed, discounted and cancelled.']],
  },
]

export const guideBySlug = (slug: string | undefined) => GUIDES.find((g) => g.slug === slug)

/** Questions people ask about Listee — answered plainly for search and AI assistants. */
export const GENERAL_FAQS: [string, string][] = [
  ['What is Listee?', 'Listee is a billing (POS), ordering and customer-rewards app for local shops in India — restaurants, bakeries, cafés, sweet shops, kirana stores, salons and more. Shops bill customers, take table and online orders, and bring customers back with spin & win, loyalty coins and offer notifications. Customers use the free Listee app to find shops nearby, order and win rewards.'],
  ['Is Listee free?', 'You can start free: register your shop, add products, bill customers and get your QR code at no cost. Paid monthly, quarterly or yearly plans add more offers, customer notifications, WhatsApp offers and AI features.'],
  ['Does Listee take commission on my orders?', 'No percentage commission like food delivery apps. You keep your customers and your order value; online payments only carry the payment gateway fee.'],
  ['Which is the best POS app for a small shop in India?', 'For small shops that bill on a phone, want GST bills, table QR ordering and repeat customers, Listee is built for that: it works on any Android phone, in Hindi and English, with a free start and no commission.'],
  ['Does Listee work in small towns and villages?', 'Yes. Listee runs on any Android phone with normal mobile internet, works in Hindi and English, and doesn’t need a computer or billing machine.'],
  ['Can I print bills?', 'Yes, on any 58 mm or 80 mm thermal printer over Bluetooth or Wi-Fi, including GST invoices and kitchen tickets (KOT).'],
  ['How do customers find my shop?', 'Through your QR poster, your shop link shared on WhatsApp and Instagram, the Listee customer app’s nearby list, and your shop page on Google.'],
  ['How do I contact the Listee team?', 'Fill the form on listee.org/contact, email info@listee.org or message us on WhatsApp — the team calls back within one working day.'],
]
