/** Shop-type pages (/billing-software/:type): "billing software for bakery" etc. */
export interface BusinessType {
  slug: string
  name: string
  /** For "{x} billing software". */
  short: string
  icon: string
  headline: string
  pains: string[]
  wins: string[]
  example: string
  faqs: [string, string][]
}

export const BUSINESS_TYPES: BusinessType[] = [
  {
    slug: 'restaurant',
    name: 'Restaurants & dhabas',
    short: 'Restaurant',
    icon: 'UtensilsCrossed',
    headline: 'Restaurant POS with table QR ordering, KOT and GST bills',
    pains: ['Waiters write orders on paper and the kitchen gets them late', 'Customers wait for the menu and the bill', 'Delivery apps take 20–30% of every order'],
    wins: ['Customers scan the table QR, see the menu with photos and order', 'Kitchen ticket (KOT) prints by itself; the bill prints in one tap', 'Your own order link — no commission on your orders'],
    example: 'A 12-table dhaba switches on table QR: orders reach the kitchen instantly, and the owner sees the day’s sales and cash on one screen at closing.',
    faqs: [
      ['Can customers order from the table?', 'Yes. Each table gets its own QR. Customers scan, choose items and send the order; it rings on your phone and prints a KOT.'],
      ['Does it print GST bills?', 'Yes. Switch on GST, add your GSTIN and rates; bills show CGST and SGST and print on 58 mm or 80 mm thermal printers.'],
    ],
  },
  {
    slug: 'bakery',
    name: 'Bakeries & cake shops',
    short: 'Bakery',
    icon: 'CakeSlice',
    headline: 'Bakery billing app with cake orders, combos and birthday offers',
    pains: ['Cake orders get lost in WhatsApp chats', 'Fresh items go unsold by evening', 'Regular customers buy elsewhere on birthdays'],
    wins: ['Take cake and advance orders with time and notes', 'Push an evening offer on fresh items to nearby customers', 'Birthday and anniversary reminders bring families back'],
    example: 'Perfect Bakery adds its cakes, pastries and a “Pastry + Coffee” combo; on Saturday evening it notifies followers about 20% off fresh pastries and clears the shelf.',
    faqs: [
      ['Can I take cake orders in advance?', 'Yes. Customers order through your shop link or you add the order at the counter with notes like message on cake and pickup time.'],
      ['Can I make combos?', 'Yes. Group items into a combo with one price, for example Pastry + Cold Coffee at ₹149.'],
    ],
  },
  {
    slug: 'cafe',
    name: 'Cafés & tea stalls',
    short: 'Café',
    icon: 'Coffee',
    headline: 'Café POS with QR menu, loyalty points and quick billing',
    pains: ['Long queue at the counter in rush hour', 'Students and office-goers try a new café every week', 'No idea which items actually make money'],
    wins: ['QR menu and pre-orders cut the queue', 'Points on every bill — 10th coffee free — keeps them loyal', 'Top-items and sales reports every day'],
    example: 'A college café runs “every 5th chai free” on Listee loyalty and sees the same students daily instead of weekly.',
    faqs: [['Is there a loyalty card?', 'Yes, a digital one. Customers collect points or stamps with every order and redeem rewards you choose.']],
  },
  {
    slug: 'sweet-shop',
    name: 'Sweet shops & mithai',
    short: 'Sweet shop',
    icon: 'Candy',
    headline: 'Sweet shop billing software with weight-wise items and festival offers',
    pains: ['Huge festival rush and long billing queues', 'Bulk and party orders tracked on paper', 'Customers forget you after the festival'],
    wins: ['Fast counter billing with one-tap items', 'Festival combos and gift boxes', 'Send Diwali, Raksha Bandhan and wedding-season offers to all your customers'],
    example: 'A mithai shop sends a Raksha Bandhan gift-box offer to 600 past customers a week before the festival.',
    faqs: [['Can I sell by kg?', 'Yes. Add items per kg, 500 g or piece and bill any quantity.']],
  },
  {
    slug: 'kirana-store',
    name: 'Kirana & general stores',
    short: 'Kirana store',
    icon: 'ShoppingBasket',
    headline: 'Kirana store billing app with home orders and stock alerts',
    pains: ['Udhaar and bills kept in notebooks', 'Customers call to ask what’s available', 'Big supermarkets attract your regulars'],
    wins: ['Bill on your phone, share the bill on WhatsApp', 'Customers order from home on your shop link', 'Points and offers that supermarkets can’t give personally'],
    example: 'A village kirana shares its Listee link in the society WhatsApp group and starts getting 15 home orders a day.',
    faqs: [['Do I need a computer?', 'No. Listee runs on any Android phone. A Bluetooth printer is optional.']],
  },
  {
    slug: 'cloud-kitchen',
    name: 'Cloud kitchens & tiffin',
    short: 'Cloud kitchen',
    icon: 'ChefHat',
    headline: 'Cloud kitchen software — your own ordering link without commission',
    pains: ['Delivery apps take a big cut', 'No direct contact with your own customers', 'Daily menu changes are hard to share'],
    wins: ['Your own order page and link, payments direct to you', 'Push today’s menu to every customer', 'Repeat-order rewards for tiffin subscribers'],
    example: 'A tiffin service shares its daily menu by push notification at 11 am; orders come straight in with no app commission.',
    faqs: [['Do I pay commission?', 'Listee does not take a percentage of your food bill. You pay a simple plan; online payments only carry the payment gateway fee.']],
  },
  {
    slug: 'juice-shop',
    name: 'Juice & ice-cream shops',
    short: 'Juice shop',
    icon: 'GlassWater',
    headline: 'Juice shop billing with QR menu, spin & win and combos',
    pains: ['Customers walk past to the next stall', 'Summer rush, quiet winters', 'No repeat customers'],
    wins: ['Spin & win on every scan gets people to stop', 'Winter combos and offers to past customers', 'Points for every glass'],
    example: 'A juice centre puts the Listee QR poster at the counter; 1 in 3 customers scans to spin for a free glass and comes back to redeem it.',
    faqs: [['What is spin & win?', 'Customers scan your QR and spin a wheel to win small rewards you set, like ₹10 off or a free topping. It makes people scan and come back.']],
  },
  {
    slug: 'salon',
    name: 'Salons, spas & parlours',
    short: 'Salon',
    icon: 'Scissors',
    headline: 'Salon software with service menu, offers and customer reminders',
    pains: ['Clients forget to come back on time', 'Price list on a wall nobody reads', 'Slow days mid-week'],
    wins: ['Digital service menu and prices', 'Mid-week offers pushed to regular clients', 'Birthday offers and loyalty visits'],
    example: 'A unisex salon sends a Tuesday-Wednesday 15% offer to clients who haven’t visited in 30 days.',
    faqs: [['Can I list services instead of products?', 'Yes. Add services with price and duration the same way as products.']],
  },
  {
    slug: 'medical-store',
    name: 'Medical & pharmacy',
    short: 'Medical store',
    icon: 'Pill',
    headline: 'Medical store billing app with GST invoices and repeat orders',
    pains: ['Monthly-medicine customers drift to online pharmacies', 'Handwritten bills', 'No way to remind patients to refill'],
    wins: ['GST invoices from your phone', 'Customers re-order on your shop link', 'Notify regulars when their refill is due'],
    example: 'A chemist notifies diabetic and BP patients on the 25th of every month to re-order — and keeps them from switching to apps.',
    faqs: [['Is my customer data safe?', 'Yes. Your customer list belongs to you; Listee never sells it or shows it to other shops.']],
  },
  {
    slug: 'clothing-store',
    name: 'Clothing & fashion',
    short: 'Clothing store',
    icon: 'Shirt',
    headline: 'Clothing store POS with new-arrival alerts and member offers',
    pains: ['New stock arrives but customers don’t know', 'Discount-only shoppers', 'Festival season gets missed'],
    wins: ['Push “new arrivals” to followers', 'Member-only offers and points', 'Season-sale campaigns in one tap'],
    example: 'A boutique posts its new Diwali collection and notifies 400 followers the same afternoon.',
    faqs: [['Can I show photos of products?', 'Yes. Add photos to every product; customers see them on your shop page.']],
  },
]

export const typeBySlug = (slug: string | undefined) => BUSINESS_TYPES.find((t) => t.slug === slug)
