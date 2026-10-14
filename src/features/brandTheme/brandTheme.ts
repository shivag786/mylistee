import { apiConfig } from '@/config/api.config'
/**
 * Admin-set brand theme (colours + fonts) applied over tokens.css.
 *
 * The server hands the theme to every device through GET /config. Only what
 * differs from the stock palette is written, so the default theme renders
 * exactly as tokens.css defines it. Hover/active/soft shades and text-on-colour
 * are derived here, which keeps the admin form to one pick per colour. The last
 * theme is cached so a reload paints in it straight away, before /config lands.
 */

export interface BrandColors {
  primary: string
  secondary: string
  accent: string
  success: string
  info: string
  warning: string
  danger: string
  background: string
  surface: string
  text: string
}

/** Optional colours; null = follow the main palette. */
export interface BrandExtras {
  header: string | null
  nav: string | null
  navActive: string | null
  gradientFrom: string | null
  gradientTo: string | null
  star: string | null
  offer: string | null
}

export type ThemeMode = 'light' | 'dark' | 'system'
export type ThemeRadius = 'sharp' | 'rounded' | 'pill'
export type ThemeTextSize = 'small' | 'normal' | 'large'

export interface BrandTheme {
  colors: BrandColors
  extras: BrandExtras
  /** Which colour mode the app opens in ('system' follows the phone). */
  mode: ThemeMode
  dark: { background: string; surface: string; text: string }
  radius: ThemeRadius
  textSize: ThemeTextSize
  font: string
  headingFont: string
  /** Tint shop-page menu cards with each dish's colours. */
  menuCardColors: boolean
  /** App icon: drawn from the theme or uploaded; version busts caches. */
  icon: { mode: 'auto' | 'upload'; version: string | null }
}

/** Mirrors the stock palette in tokens.css (and SettingService defaults). */
export const DEFAULT_THEME: BrandTheme = {
  colors: {
    primary: '#e23744',
    secondary: '#2d3436',
    accent: '#fbbf24',
    success: '#22c55e',
    info: '#3b82f6',
    warning: '#f59e0b',
    danger: '#ef4444',
    background: '#f8f9fa',
    surface: '#ffffff',
    text: '#212121',
  },
  extras: { header: null, nav: null, navActive: null, gradientFrom: null, gradientTo: null, star: null, offer: null },
  mode: 'light',
  dark: { background: '#1e1e1e', surface: '#262626', text: '#f3f4f6' },
  radius: 'rounded',
  textSize: 'normal',
  font: 'Metropolis',
  headingFont: 'Metropolis',
  menuCardColors: true,
  icon: { mode: 'auto', version: null },
}

/** Component radii per corner style (px). 'rounded' is tokens.css as shipped. */
const RADII: Record<ThemeRadius, Record<string, number> | null> = {
  sharp: { button: 6, input: 6, card: 10, image: 10, cover: 12, dialog: 14 },
  rounded: null,
  pill: { button: 9999, input: 20, card: 28, image: 24, cover: 32, dialog: 28 },
}

/** Root font size per text size — every rem-based size scales with it. */
const TEXT_SCALE: Record<ThemeTextSize, string | null> = { small: '93.75%', normal: null, large: '106.25%' }

/** Must match SettingService::THEME_FONTS on the server. */
export const THEME_FONTS = [
  'Metropolis',
  'Poppins',
  'Inter',
  'Nunito',
  'Montserrat',
  'Roboto',
  'Lato',
  'Open Sans',
  'Rubik',
  'DM Sans',
  'Outfit',
  'Playfair Display',
  'Mukta',
  'Hind',
  'Baloo 2',
] as const

/** Ready-made palettes for one-tap picks in the admin. */
export const THEME_PRESETS: { name: string; colors: Partial<BrandColors> }[] = [
  { name: 'Listee red', colors: { primary: '#e23744', secondary: '#2d3436', accent: '#fbbf24' } },
  { name: 'Ocean blue', colors: { primary: '#2563eb', secondary: '#1e293b', accent: '#f59e0b' } },
  { name: 'Fresh green', colors: { primary: '#16a34a', secondary: '#1f2937', accent: '#facc15' } },
  { name: 'Royal purple', colors: { primary: '#7c3aed', secondary: '#1e1b4b', accent: '#f472b6' } },
  { name: 'Sunset orange', colors: { primary: '#ea580c', secondary: '#292524', accent: '#fde047' } },
  { name: 'Teal', colors: { primary: '#0d9488', secondary: '#134e4a', accent: '#fbbf24' } },
]

/** The one stock font that ships with the app (self-hosted, works offline). */
const BUNDLED_FONT = 'Metropolis'
/** Lato has no 500/600; asking Google for a missing weight fails the whole request. */
const FONT_WEIGHTS: Record<string, string> = { Lato: '300;400;700;900' }

const STORAGE_KEY = 'listee:brandTheme'
const STYLE_ID = 'brand-theme'
const FONT_LINK_ID = 'brand-theme-fonts'

/**
 * Text colour for a filled button/chip: white while it keeps 3:1 contrast (the
 * WCAG bar for bold UI text, and what brand reds/greens/blues clear), dark on
 * light colours such as yellow.
 */
export function readableOn(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return 1.05 / (luminance + 0.05) >= 3 ? '#ffffff' : '#1e1e1e'
}

const mix = (color: string, pct: number, other: string) => `color-mix(in srgb, ${color} ${pct}%, ${other})`

/** A brand/status colour and its derived hover, active, soft and on-colour shades. */
function colorVars(name: string, hex: string, extra: Record<string, string> = {}): string[] {
  return Object.entries({
    [`--${name}`]: hex,
    [`--${name}-hover`]: mix(hex, 86, 'black'),
    [`--${name}-active`]: mix(hex, 74, 'black'),
    // Mixed with the surface so it holds up in dark mode too.
    [`--${name}-soft`]: mix(hex, 13, 'var(--surface)'),
    [`--${name}-foreground`]: readableOn(hex),
    ...extra,
  }).map(([k, v]) => `${k}: ${v};`)
}

/** Card/text colours and the greys, borders and muted fills derived from them. */
function surfaceVars(surface: string, text: string): string[] {
  return [
    `--surface: ${surface};`,
    `--surface-elevated: ${surface};`,
    `--surface-muted: ${mix(text, 5, surface)};`,
    `--accent: ${mix(text, 5, surface)};`,
    `--foreground: ${text};`,
    `--accent-foreground: ${text};`,
    `--text-secondary: ${mix(text, 66, surface)};`,
    `--text-muted: ${mix(text, 46, surface)};`,
    `--text-disabled: ${mix(text, 26, surface)};`,
    `--border: ${mix(text, 11, surface)};`,
    `--border-strong: ${mix(text, 19, surface)};`,
  ]
}

const fontStack = (font: string) => `'${font}', 'Metropolis', system-ui, -apple-system, sans-serif`

/** The CSS for a theme — only the parts that differ from the default. */
export function themeCss(theme: BrandTheme): string {
  const c = theme.colors
  const d = DEFAULT_THEME.colors
  const root: string[] = []
  const light: string[] = []

  if (c.primary !== d.primary) {
    root.push(...colorVars('primary', c.primary, { '--ring': c.primary, '--wallet-from': c.primary }))
  }
  if (c.secondary !== d.secondary) root.push(...colorVars('secondary', c.secondary))
  if (c.accent !== d.accent) {
    root.push(
      ...colorVars('gold', c.accent, { '--wallet-to': c.accent }),
      ...colorVars('premium', c.accent),
    )
  }
  for (const key of ['success', 'info', 'warning', 'danger'] as const) {
    if (c[key] !== d[key]) root.push(...colorVars(key, c[key]))
  }

  // Page, card and text colours are light-mode choices; dark mode has its own.
  if (c.background !== d.background) light.push(`--background: ${c.background};`)
  if (c.surface !== d.surface || c.text !== d.text) light.push(...surfaceVars(c.surface, c.text))

  const dark: string[] = []
  const dd = DEFAULT_THEME.dark
  if (theme.dark.background !== dd.background) dark.push(`--background: ${theme.dark.background};`)
  if (theme.dark.surface !== dd.surface || theme.dark.text !== dd.text) {
    dark.push(...surfaceVars(theme.dark.surface, theme.dark.text))
  }

  // Optional accents — unset ones keep following the palette (tokens.css).
  const x = theme.extras
  if (x.header) root.push(`--header-bg: ${x.header};`)
  if (x.nav) root.push(`--nav-bg: ${x.nav};`)
  if (x.navActive) root.push(`--nav-active: ${x.navActive};`)
  if (x.gradientFrom) root.push(`--gradient-from: ${x.gradientFrom};`, `--wallet-from: ${x.gradientFrom};`)
  if (x.gradientTo) root.push(`--gradient-to: ${x.gradientTo};`, `--wallet-to: ${x.gradientTo};`)
  if (x.star) root.push(`--star: ${x.star};`)
  if (x.offer) {
    root.push(
      `--offer: ${x.offer};`,
      `--offer-soft: ${mix(x.offer, 13, 'var(--surface)')};`,
      `--offer-foreground: ${readableOn(x.offer)};`,
    )
  }

  const radii = RADII[theme.radius]
  if (radii) root.push(...Object.entries(radii).map(([k, v]) => `--radius-${k}: ${v}px;`))

  if (theme.font !== DEFAULT_THEME.font) root.push(`--font-sans: ${fontStack(theme.font)};`)
  if (theme.headingFont !== DEFAULT_THEME.headingFont) root.push(`--font-heading: ${fontStack(theme.headingFont)};`)

  const scale = TEXT_SCALE[theme.textSize]

  // Doubled :root outranks the `.dark` block in tokens.css.
  return [
    root.length ? `:root:root { ${root.join(' ')} }` : '',
    light.length ? `:root:root:not(.dark) { ${light.join(' ')} }` : '',
    dark.length ? `:root:root.dark { ${dark.join(' ')} }` : '',
    scale ? `html { font-size: ${scale}; }` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

function googleFontsUrl(fonts: string[]): string | null {
  const families = [...new Set(fonts)]
    .filter((f) => f !== BUNDLED_FONT)
    .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@${FONT_WEIGHTS[f] ?? '400;500;600;700'}`)
  return families.length ? `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap` : null
}

function upsert<T extends HTMLElement>(id: string, create: () => T): T {
  const existing = document.getElementById(id) as T | null
  if (existing) return existing
  const el = create()
  el.id = id
  document.head.appendChild(el)
  return el
}

/** Write a theme to the page: CSS variables, web fonts, browser UI colour. */
export function applyTheme(theme: BrandTheme): void {
  upsert(STYLE_ID, () => document.createElement('style')).textContent = themeCss(theme)

  const fontsUrl = googleFontsUrl([theme.font, theme.headingFont])
  const existingLink = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null
  if (fontsUrl) {
    const link = upsert(FONT_LINK_ID, () => {
      const l = document.createElement('link')
      l.rel = 'stylesheet'
      return l
    })
    if (link.href !== fontsUrl) link.href = fontsUrl
  } else {
    existingLink?.remove()
  }

  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.colors.primary)
  applyIcons(theme)
  publishIcon(theme.icon)
}

/**
 * Point the tab icon and the iPhone home-screen icon at the theme's icons
 * (drawn in the theme colours, or the admin's upload). The version is in the
 * URL, so a change shows without waiting on the browser's cache.
 */
function applyIcons(theme: BrandTheme): void {
  if (!theme.icon.version) return
  const url = (name: string) => `${appIconUrl(name)}?v=${theme.icon.version}`
  const set = (rel: string, href: string, sizes: string) => {
    let link = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
    if (!link) {
      link = document.createElement('link')
      link.rel = rel
      document.head.appendChild(link)
    }
    link.type = 'image/png'
    link.setAttribute('sizes', sizes)
    if (link.href !== href) link.href = href
  }
  set('icon', url('icon-64'), '64x64')
  set('apple-touch-icon', url('apple-180'), '180x180')
}

/** Where the API serves an app icon (see AppBrandingController). */
export function appIconUrl(name: string): string {
  return `${apiConfig.baseUrl.replace(/\/$/, '')}/app/icons/${name}.png`
}

/** Whether the app should be dark right now, by the admin's mode. */
export function prefersDark(mode: ThemeMode): boolean {
  if (mode === 'dark') return true
  if (mode === 'system') return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  return false
}

/** Normalise whatever the server or cache sent into a complete theme. */
export function resolveTheme(input: Partial<BrandTheme> | null | undefined): BrandTheme {
  return {
    colors: { ...DEFAULT_THEME.colors, ...(input?.colors ?? {}) },
    extras: { ...DEFAULT_THEME.extras, ...(input?.extras ?? {}) },
    mode: input?.mode ?? DEFAULT_THEME.mode,
    dark: { ...DEFAULT_THEME.dark, ...(input?.dark ?? {}) },
    radius: input?.radius ?? DEFAULT_THEME.radius,
    textSize: input?.textSize ?? DEFAULT_THEME.textSize,
    font: input?.font ?? DEFAULT_THEME.font,
    headingFont: input?.headingFont ?? DEFAULT_THEME.headingFont,
    menuCardColors: input?.menuCardColors ?? DEFAULT_THEME.menuCardColors,
    icon: { ...DEFAULT_THEME.icon, ...(input?.icon ?? {}) },
  }
}

export function cacheTheme(theme: BrandTheme): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme))
  } catch {
    // Storage blocked — the theme still applies once /config loads.
  }
}

function readCache(): BrandTheme | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? resolveTheme(JSON.parse(raw) as Partial<BrandTheme>) : null
  } catch {
    return null
  }
}

/** The admin's colour mode from the last /config seen, for the first paint. */
export function cachedThemeMode(): ThemeMode {
  return readCache()?.mode ?? DEFAULT_THEME.mode
}

/** Apply the cached theme before first paint, so a reload doesn't flash the default. */
export function bootTheme(): void {
  const cached = readCache()
  if (!cached) return
  applyTheme(cached)
  // Set dark mode now too, rather than after React mounts.
  document.documentElement.classList.toggle('dark', prefersDark(cached.mode))
}

/* ---------------------------------------------------------------- icon -- */
// The applied theme's icon, readable without React Query, so the Logo (shown
// before providers and in tests) can follow an uploaded app icon.

let currentIcon: BrandTheme['icon'] = DEFAULT_THEME.icon
const iconListeners = new Set<() => void>()

export function subscribeBrandIcon(listener: () => void): () => void {
  iconListeners.add(listener)
  return () => iconListeners.delete(listener)
}

export function getBrandIcon(): BrandTheme['icon'] {
  return currentIcon
}

function publishIcon(icon: BrandTheme['icon']): void {
  if (icon.mode === currentIcon.mode && icon.version === currentIcon.version) return
  currentIcon = icon
  iconListeners.forEach((l) => l())
}
