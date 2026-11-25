/**
 * Shop QR poster looks, one per kind of shop. The shop's category picks one
 * automatically (by name keywords); the admin can switch it before printing.
 */
export type PosterLang = 'en' | 'hinglish' | 'hi'
export type PosterHook = 'spin' | 'menu' | 'offers' | 'review'

export interface PosterTheme {
  id: string
  label: string
  /** Background of the top half. */
  bg: string
  /** Main accent: ribbons, steps, QR frame. */
  accent: string
  /** Text on the accent colour. */
  onAccent: string
  /** Headline colour on the background. */
  ink: string
  /** Soft panel behind the benefits. */
  soft: string
  motifs: string[]
  /** Hook that suits the shop best. */
  hook: PosterHook
  benefits: Record<PosterLang, [string, string][]>
}

const T = (en: [string, string][], hinglish: [string, string][], hi: [string, string][]) => ({ en, hinglish, hi })

export const POSTER_THEMES: PosterTheme[] = [
  {
    id: 'food',
    label: 'Restaurant / Food',
    bg: 'linear-gradient(160deg,#ff5f3b 0%,#e11d48 55%,#9f1239 100%)',
    accent: '#ffd23f',
    onAccent: '#7a0e1c',
    ink: '#ffffff',
    soft: '#fff4e6',
    motifs: ['🍕', '🍔', '🍛', '🌶️', '🍜', '🥘', '🍟', '🧆'],
    hook: 'menu',
    benefits: T(
      [['📖', 'Full menu with photos'], ['🎁', 'Spin & win discounts'], ['⚡', 'Order without waiting']],
      [['📖', 'Photo ke saath poora menu'], ['🎁', 'Spin karo, discount jeeto'], ['⚡', 'Bina line ke order']],
      [['📖', 'फ़ोटो के साथ पूरा मेन्यू'], ['🎁', 'स्पिन करें, छूट जीतें'], ['⚡', 'बिना लाइन के ऑर्डर']],
    ),
  },
  {
    id: 'cafe',
    label: 'Cafe / Tea',
    bg: 'linear-gradient(160deg,#6f4e37 0%,#4a3224 60%,#2b1d14 100%)',
    accent: '#f7c873',
    onAccent: '#3b2618',
    ink: '#fff7ea',
    soft: '#fbf1e3',
    motifs: ['☕', '🍵', '🥐', '🧋', '🍪', '🫖', '🥪', '🍰'],
    hook: 'spin',
    benefits: T(
      [['☕', 'See today’s menu'], ['🎁', 'Free spin every visit'], ['⭐', 'Collect points, get free chai']],
      [['☕', 'Aaj ka menu dekho'], ['🎁', 'Har visit pe free spin'], ['⭐', 'Points jodo, free chai pao']],
      [['☕', 'आज का मेन्यू देखें'], ['🎁', 'हर बार मुफ़्त स्पिन'], ['⭐', 'पॉइंट जोड़ें, मुफ़्त चाय पाएं']],
    ),
  },
  {
    id: 'fresh',
    label: 'Juice / Ice cream',
    bg: 'linear-gradient(160deg,#22c55e 0%,#16a34a 50%,#0f766e 100%)',
    accent: '#fde047',
    onAccent: '#14532d',
    ink: '#ffffff',
    soft: '#effdf4',
    motifs: ['🍹', '🍊', '🍉', '🥭', '🍓', '🍍', '🍦', '🥤'],
    hook: 'spin',
    benefits: T(
      [['🥤', 'All flavours & prices'], ['🎁', 'Spin & win a free glass'], ['⭐', 'Points on every order']],
      [['🥤', 'Saare flavour aur rate'], ['🎁', 'Spin karo, free glass jeeto'], ['⭐', 'Har order pe points']],
      [['🥤', 'सभी फ़्लेवर और रेट'], ['🎁', 'स्पिन करें, मुफ़्त गिलास जीतें'], ['⭐', 'हर ऑर्डर पर पॉइंट']],
    ),
  },
  {
    id: 'sweet',
    label: 'Bakery / Sweets',
    bg: 'linear-gradient(160deg,#f472b6 0%,#db2777 55%,#9d174d 100%)',
    accent: '#fff1a8',
    onAccent: '#831843',
    ink: '#ffffff',
    soft: '#fff0f7',
    motifs: ['🧁', '🍰', '🍩', '🎂', '🍪', '🥐', '🍬', '🍫'],
    hook: 'spin',
    benefits: T(
      [['🎂', 'Order cakes in advance'], ['🎁', 'Spin & win sweet treats'], ['🎉', 'Birthday surprises']],
      [['🎂', 'Cake pehle se order karo'], ['🎁', 'Spin karo, meetha jeeto'], ['🎉', 'Birthday pe surprise']],
      [['🎂', 'केक पहले से ऑर्डर करें'], ['🎁', 'स्पिन करें, मिठाई जीतें'], ['🎉', 'जन्मदिन पर सरप्राइज़']],
    ),
  },
  {
    id: 'beauty',
    label: 'Salon / Spa / Beauty',
    bg: 'linear-gradient(160deg,#a855f7 0%,#7e22ce 55%,#4c1d95 100%)',
    accent: '#f9d9a8',
    onAccent: '#4c1d95',
    ink: '#ffffff',
    soft: '#f7f0ff',
    motifs: ['💇‍♀️', '💅', '✨', '💄', '🪞', '💆', '🌸', '✂️'],
    hook: 'offers',
    benefits: T(
      [['💅', 'All services & prices'], ['🎁', 'Spin & win a free service'], ['📅', 'Skip the waiting']],
      [['💅', 'Saari services aur rate'], ['🎁', 'Spin karo, free service jeeto'], ['📅', 'Wait mat karo']],
      [['💅', 'सभी सेवाएं और रेट'], ['🎁', 'स्पिन करें, मुफ़्त सेवा जीतें'], ['📅', 'इंतज़ार से बचें']],
    ),
  },
  {
    id: 'fitness',
    label: 'Gym / Fitness',
    bg: 'linear-gradient(160deg,#18181b 0%,#09090b 100%)',
    accent: '#a3e635',
    onAccent: '#0b0b0c',
    ink: '#ffffff',
    soft: '#f4fde4',
    motifs: ['💪', '🏋️', '🔥', '⚡', '🥇', '🏃', '🥗', '⏱️'],
    hook: 'offers',
    benefits: T(
      [['🔥', 'Plans & offers'], ['🎁', 'Spin & win free days'], ['🏆', 'Rewards for regulars']],
      [['🔥', 'Plans aur offers'], ['🎁', 'Spin karo, free din jeeto'], ['🏆', 'Roz aao, reward pao']],
      [['🔥', 'प्लान और ऑफ़र'], ['🎁', 'स्पिन करें, मुफ़्त दिन जीतें'], ['🏆', 'रोज़ आएं, इनाम पाएं']],
    ),
  },
  {
    id: 'health',
    label: 'Medical / Pharmacy',
    bg: 'linear-gradient(160deg,#14b8a6 0%,#0d9488 50%,#115e59 100%)',
    accent: '#ffffff',
    onAccent: '#0f766e',
    ink: '#ffffff',
    soft: '#effcfa',
    motifs: ['💊', '🩺', '➕', '❤️', '🩹', '🌿', '💉', '🧴'],
    hook: 'offers',
    benefits: T(
      [['💊', 'Order medicines easily'], ['💰', 'Discount on every bill'], ['🔔', 'Refill reminders']],
      [['💊', 'Dawai aasaani se order'], ['💰', 'Har bill pe discount'], ['🔔', 'Refill ki yaad']],
      [['💊', 'दवाइयाँ आसानी से ऑर्डर'], ['💰', 'हर बिल पर छूट'], ['🔔', 'रिफ़िल की याद']],
    ),
  },
  {
    id: 'learn',
    label: 'Stationery / Coaching',
    bg: 'linear-gradient(160deg,#2563eb 0%,#1d4ed8 55%,#1e3a8a 100%)',
    accent: '#facc15',
    onAccent: '#1e3a8a',
    ink: '#ffffff',
    soft: '#eef4ff',
    motifs: ['✏️', '📚', '🎓', '📐', '🖍️', '📝', '🎒', '💡'],
    hook: 'offers',
    benefits: T(
      [['📚', 'See all items & courses'], ['🎁', 'Spin & win gifts'], ['⭐', 'Student rewards']],
      [['📚', 'Saare items aur courses'], ['🎁', 'Spin karo, gift jeeto'], ['⭐', 'Students ke liye rewards']],
      [['📚', 'सभी सामान और कोर्स'], ['🎁', 'स्पिन करें, गिफ़्ट जीतें'], ['⭐', 'छात्रों के लिए इनाम']],
    ),
  },
  {
    id: 'fashion',
    label: 'Clothing / Fashion',
    bg: 'linear-gradient(160deg,#1f1f1f 0%,#0a0a0a 100%)',
    accent: '#e7c77a',
    onAccent: '#1a1a1a',
    ink: '#ffffff',
    soft: '#fbf6ea',
    motifs: ['👗', '👠', '🛍️', '👔', '👜', '🕶️', '👟', '💍'],
    hook: 'offers',
    benefits: T(
      [['🛍️', 'New arrivals first'], ['🎁', 'Spin & win extra off'], ['💳', 'Member-only deals']],
      [['🛍️', 'New collection sabse pehle'], ['🎁', 'Spin karo, extra off jeeto'], ['💳', 'Sirf members ke deals']],
      [['🛍️', 'नया कलेक्शन सबसे पहले'], ['🎁', 'स्पिन करें, अतिरिक्त छूट'], ['💳', 'सिर्फ़ सदस्यों के ऑफ़र']],
    ),
  },
  {
    id: 'tech',
    label: 'Electronics / Repair',
    bg: 'linear-gradient(160deg,#0f172a 0%,#1e293b 55%,#0c4a6e 100%)',
    accent: '#22d3ee',
    onAccent: '#082f49',
    ink: '#ffffff',
    soft: '#ecfeff',
    motifs: ['📱', '🎧', '💡', '🔌', '💻', '🔋', '⌚', '🛠️'],
    hook: 'offers',
    benefits: T(
      [['📱', 'Products & service rates'], ['🎁', 'Spin & win accessories'], ['🔔', 'Repair status updates']],
      [['📱', 'Products aur service rate'], ['🎁', 'Spin karo, accessories jeeto'], ['🔔', 'Repair ka status']],
      [['📱', 'प्रोडक्ट और सर्विस रेट'], ['🎁', 'स्पिन करें, एक्सेसरी जीतें'], ['🔔', 'रिपेयर की जानकारी']],
    ),
  },
  {
    id: 'grocery',
    label: 'Grocery / Kirana',
    bg: 'linear-gradient(160deg,#84cc16 0%,#4d7c0f 60%,#365314 100%)',
    accent: '#fde047',
    onAccent: '#365314',
    ink: '#ffffff',
    soft: '#f6fde8',
    motifs: ['🛒', '🥦', '🍎', '🧺', '🥛', '🍞', '🥚', '🧅'],
    hook: 'offers',
    benefits: T(
      [['🛒', 'Order from home'], ['💰', 'Daily deals & discounts'], ['⭐', 'Points on every bill']],
      [['🛒', 'Ghar baithe order'], ['💰', 'Roz ke deals aur discount'], ['⭐', 'Har bill pe points']],
      [['🛒', 'घर बैठे ऑर्डर'], ['💰', 'रोज़ के ऑफ़र और छूट'], ['⭐', 'हर बिल पर पॉइंट']],
    ),
  },
  {
    id: 'classic',
    label: 'Listee classic (any shop)',
    bg: 'linear-gradient(160deg,#1f3a8a 0%,#14213d 100%)',
    accent: '#a3e635',
    onAccent: '#14213d',
    ink: '#ffffff',
    soft: '#f4f6fa',
    motifs: ['🎁', '⭐', '🛍️', '🎉', '💰', '🏆', '✨', '🎡'],
    hook: 'spin',
    benefits: T(
      [['🎁', 'Free spin every visit'], ['🏷️', 'Today’s offers'], ['⭐', 'Points & rewards']],
      [['🎁', 'Har visit pe free spin'], ['🏷️', 'Aaj ke offers'], ['⭐', 'Points aur rewards']],
      [['🎁', 'हर बार मुफ़्त स्पिन'], ['🏷️', 'आज के ऑफ़र'], ['⭐', 'पॉइंट और इनाम']],
    ),
  },
]

const KEYWORDS: [string, RegExp][] = [
  ['cafe', /cafe|café|coffee|tea|chai/i],
  ['fresh', /juice|ice ?cream|shake|kulfi|lassi/i],
  ['sweet', /bakery|cake|sweet|mithai|dessert|confection/i],
  ['food', /restaurant|hotel|dhaba|food|biryani|pizza|kitchen|mess|tiffin|caterer|snack/i],
  ['beauty', /salon|spa|beauty|parlou?r|makeup|nail|barber|mehendi/i],
  ['fitness', /gym|fitness|yoga|zumba|sport/i],
  ['health', /medical|pharma|chemist|clinic|hospital|lab|optical|dental/i],
  ['learn', /stationery|coaching|institute|school|book|tuition|academy|class/i],
  ['fashion', /cloth|fashion|boutique|garment|footwear|shoe|jewel|saree|tailor/i],
  ['tech', /electronic|mobile|repair|service cent|computer|laptop|appliance/i],
  ['grocery', /grocery|kirana|supermarket|mart|general store|dairy|vegetable|fruit/i],
]

/** The theme that fits a category name ("Fast Food" → food). */
export function themeForCategory(category: string | null | undefined): PosterTheme {
  const name = category ?? ''
  const id = KEYWORDS.find(([, re]) => re.test(name))?.[0] ?? 'classic'
  return POSTER_THEMES.find((t) => t.id === id) ?? POSTER_THEMES[POSTER_THEMES.length - 1]
}

export const HOOKS: Record<PosterHook, { label: string; text: Record<PosterLang, [string, string]> }> = {
  spin: {
    label: 'Scan & win (spin)',
    text: {
      en: ['SCAN & WIN!', 'A free spin on every visit — win discounts & gifts'],
      hinglish: ['Scan Karo, Inaam Jeeto!', 'Har visit pe FREE spin — discount aur gift jeeto'],
      hi: ['स्कैन करो, इनाम जीतो!', 'हर बार मुफ़्त स्पिन — छूट और गिफ़्ट जीतें'],
    },
  },
  menu: {
    label: 'Menu & order',
    text: {
      en: ['SCAN FOR MENU', 'See photos & prices, order in seconds — and win rewards'],
      hinglish: ['Scan Karo, Menu Dekho!', 'Photo, rate aur order ek click mein — saath mein inaam bhi'],
      hi: ['स्कैन करें, मेन्यू देखें!', 'फ़ोटो, रेट और ऑर्डर एक क्लिक में — साथ में इनाम भी'],
    },
  },
  offers: {
    label: 'Today’s offers',
    text: {
      en: ['TODAY’S OFFERS INSIDE', 'Scan to unlock deals only for Listee customers'],
      hinglish: ['Aaj Ke Offers Yahan!', 'Scan karo aur sirf Listee walon ke deals pao'],
      hi: ['आज के ऑफ़र यहाँ!', 'स्कैन करें और सिर्फ़ Listee ग्राहकों के ऑफ़र पाएं'],
    },
  },
  review: {
    label: 'Rate us',
    text: {
      en: ['LOVED IT? RATE US!', 'Scan, leave a review and spin for a reward'],
      hinglish: ['Pasand Aaya? Rating Do!', 'Scan karo, review do aur reward ke liye spin karo'],
      hi: ['पसंद आया? रेटिंग दें!', 'स्कैन करें, रिव्यू दें और इनाम के लिए स्पिन करें'],
    },
  },
}

export const STEPS: Record<PosterLang, [string, string, string]> = {
  en: ['Scan', 'Spin', 'Win'],
  hinglish: ['Scan karo', 'Spin karo', 'Jeeto'],
  hi: ['स्कैन करें', 'स्पिन करें', 'जीतें'],
}

export const COPY: Record<PosterLang, { scanMe: string; app: string; verified: string; offer: string }> = {
  en: { scanMe: 'Point your camera here', app: 'Get the Listee app on Google Play', verified: 'Verified on Listee', offer: 'Offer' },
  hinglish: { scanMe: 'Camera yahan lagao', app: 'Listee app Google Play pe download karo', verified: 'Listee Verified', offer: 'Offer' },
  hi: { scanMe: 'कैमरा यहाँ लगाएं', app: 'Listee ऐप Google Play से डाउनलोड करें', verified: 'Listee वेरिफ़ाइड', offer: 'ऑफ़र' },
}
