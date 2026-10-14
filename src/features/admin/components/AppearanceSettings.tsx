import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Coins,
  Home,
  ImageUp,
  Moon,
  Palette,
  RotateCcw,
  Search,
  Shapes,
  Sparkles,
  Star,
  Trash2,
  Type,
  User,
  UtensilsCrossed,
  Wand2,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Logo } from '@/components/icons/Logo'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { cn } from '@/utils/cn'
import { useAppIconActions, useUpdateSettings } from '../hooks/useAdmin'
import type { PlatformSettings } from '../types'
import {
  DEFAULT_THEME,
  THEME_FONTS,
  THEME_PRESETS,
  appIconUrl,
  applyTheme,
  prefersDark,
  resolveTheme,
  type BrandColors,
  type BrandExtras,
  type BrandTheme,
  type ThemeMode,
  type ThemeRadius,
  type ThemeTextSize,
} from '@/features/brandTheme/brandTheme'

const COLOR_GROUPS: { title: string; fields: { key: keyof BrandColors; label: string; hint: string }[] }[] = [
  {
    title: 'Brand',
    fields: [
      { key: 'primary', label: 'Primary', hint: 'Buttons, links, logo' },
      { key: 'secondary', label: 'Secondary', hint: 'Dark buttons, accents' },
      { key: 'accent', label: 'Reward accent', hint: 'Coins, logo spark' },
    ],
  },
  {
    title: 'Status',
    fields: [
      { key: 'success', label: 'Success', hint: 'Open now' },
      { key: 'info', label: 'Info', hint: 'Notices, tips' },
      { key: 'warning', label: 'Warning', hint: 'Popular, cautions' },
      { key: 'danger', label: 'Danger', hint: 'Errors, delete' },
    ],
  },
  {
    title: 'Page (light mode)',
    fields: [
      { key: 'background', label: 'Background', hint: 'Behind everything' },
      { key: 'surface', label: 'Cards', hint: 'Cards and sheets' },
      { key: 'text', label: 'Text', hint: 'Greys are derived' },
    ],
  },
]

const EXTRA_FIELDS: { key: keyof BrandExtras; label: string; hint: string; follows: string }[] = [
  { key: 'header', label: 'Top bar', hint: 'App header background', follows: 'Cards' },
  { key: 'nav', label: 'Bottom bar', hint: 'Bottom navigation background', follows: 'Cards' },
  { key: 'navActive', label: 'Active tab', hint: 'Selected bottom-bar tab', follows: 'Primary' },
  { key: 'gradientFrom', label: 'Gradient start', hint: 'Hero, wallet card', follows: 'Primary' },
  { key: 'gradientTo', label: 'Gradient end', hint: 'Hero, wallet card', follows: 'Secondary' },
  { key: 'star', label: 'Rating stars', hint: 'Review and rating stars', follows: 'Reward accent' },
  { key: 'offer', label: 'Offers & savings', hint: '"22% off", "Save ₹40"', follows: 'Success' },
]

const MODES: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'Follow phone' },
]
const RADII: { value: ThemeRadius; label: string; preview: string }[] = [
  { value: 'sharp', label: 'Sharp', preview: 'rounded-[4px]' },
  { value: 'rounded', label: 'Rounded', preview: 'rounded-[10px]' },
  { value: 'pill', label: 'Pill', preview: 'rounded-full' },
]
const TEXT_SIZES: { value: ThemeTextSize; label: string; sample: string }[] = [
  { value: 'small', label: 'Small', sample: 'text-[13px]' },
  { value: 'normal', label: 'Normal', sample: 'text-[15px]' },
  { value: 'large', label: 'Large', sample: 'text-[17px]' },
]

const HEX = /^#[0-9a-fA-F]{6}$/

function fromSettings(s: PlatformSettings): BrandTheme {
  return resolveTheme({
    colors: {
      primary: s.themePrimary,
      secondary: s.themeSecondary,
      accent: s.themeAccent,
      success: s.themeSuccess,
      info: s.themeInfo,
      warning: s.themeWarning,
      danger: s.themeDanger,
      background: s.themeBackground,
      surface: s.themeSurface,
      text: s.themeText,
    },
    extras: {
      header: s.themeHeader || null,
      nav: s.themeNav || null,
      navActive: s.themeNavActive || null,
      gradientFrom: s.themeGradientFrom || null,
      gradientTo: s.themeGradientTo || null,
      star: s.themeStar || null,
      offer: s.themeOffer || null,
    },
    mode: s.themeMode,
    dark: { background: s.themeDarkBackground, surface: s.themeDarkSurface, text: s.themeDarkText },
    radius: s.themeRadius,
    textSize: s.themeTextSize,
    font: s.themeFont,
    headingFont: s.themeHeadingFont,
    menuCardColors: s.menuCardColors,
    icon: { mode: s.appIconMode, version: s.appIconVersion },
  })
}

function toSettings(t: BrandTheme): Partial<PlatformSettings> {
  return {
    themePrimary: t.colors.primary,
    themeSecondary: t.colors.secondary,
    themeAccent: t.colors.accent,
    themeSuccess: t.colors.success,
    themeInfo: t.colors.info,
    themeWarning: t.colors.warning,
    themeDanger: t.colors.danger,
    themeBackground: t.colors.background,
    themeSurface: t.colors.surface,
    themeText: t.colors.text,
    themeHeader: t.extras.header,
    themeNav: t.extras.nav,
    themeNavActive: t.extras.navActive,
    themeGradientFrom: t.extras.gradientFrom,
    themeGradientTo: t.extras.gradientTo,
    themeStar: t.extras.star,
    themeOffer: t.extras.offer,
    themeMode: t.mode,
    themeDarkBackground: t.dark.background,
    themeDarkSurface: t.dark.surface,
    themeDarkText: t.dark.text,
    themeRadius: t.radius,
    themeTextSize: t.textSize,
    themeFont: t.font,
    themeHeadingFont: t.headingFont,
  }
}

/** Compares what this card edits — not the menu switch or the icon, which save elsewhere. */
const sameTheme = (a: BrandTheme, b: BrandTheme) =>
  JSON.stringify({ ...a, menuCardColors: null, icon: null }) === JSON.stringify({ ...b, menuCardColors: null, icon: null })

/**
 * Colours, fonts, corner style, text size and dark mode for the whole app.
 * Edits preview live across the admin itself; nothing reaches other devices
 * until Save. Leaving the page unsaved puts the saved theme back.
 */
export function ThemeCard({ settings }: { settings: PlatformSettings }) {
  const update = useUpdateSettings()
  const saved = useMemo(() => fromSettings(settings), [settings])
  const [draft, setDraft] = useState<BrandTheme>(saved)
  const savedRef = useRef(saved)

  useEffect(() => {
    savedRef.current = saved
    setDraft(saved)
  }, [saved])

  // Live preview: the admin sees the draft everywhere on this page, dark mode included.
  useEffect(() => {
    applyTheme(draft)
    document.documentElement.classList.toggle('dark', prefersDark(draft.mode))
  }, [draft])

  // Leaving without saving restores what everyone else sees.
  useEffect(
    () => () => {
      applyTheme(savedRef.current)
      document.documentElement.classList.toggle('dark', prefersDark(savedRef.current.mode))
    },
    [],
  )

  const dirty = !sameTheme(draft, saved)
  const isDefault = sameTheme(draft, DEFAULT_THEME)

  const setColor = (key: keyof BrandColors, value: string) =>
    setDraft((d) => ({ ...d, colors: { ...d.colors, [key]: value.toLowerCase() } }))
  const setExtra = (key: keyof BrandExtras, value: string | null) =>
    setDraft((d) => ({ ...d, extras: { ...d.extras, [key]: value?.toLowerCase() ?? null } }))
  const setDark = (key: keyof BrandTheme['dark'], value: string) =>
    setDraft((d) => ({ ...d, dark: { ...d.dark, [key]: value.toLowerCase() } }))

  function save() {
    update.mutate(toSettings(draft), {
      onSuccess: () => toast.success('Theme saved — every device picks it up on its next load'),
      onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Could not save the theme.'),
    })
  }

  return (
    <Card elevation="soft" className="max-w-4xl space-y-5" padding="lg">
      <CardTitle icon={<Palette className="size-5" aria-hidden />} title="Theme">
        Colours, fonts and shapes for the whole app — customers, shop owners and admin. The logo and app icon
        follow the primary and reward colours. Changes preview here instantly; Save applies them for everyone.
      </CardTitle>

      {/* Presets */}
      <div className="space-y-2">
        <p className="text-caption font-medium text-foreground">Quick palettes</p>
        <div className="flex flex-wrap gap-2">
          {THEME_PRESETS.map((preset) => {
            const active =
              draft.colors.primary === preset.colors.primary &&
              draft.colors.secondary === preset.colors.secondary &&
              draft.colors.accent === preset.colors.accent
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => setDraft((d) => ({ ...d, colors: { ...d.colors, ...preset.colors } }))}
                aria-pressed={active}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-caption font-medium transition-colors',
                  active ? 'border-primary bg-primary-soft text-foreground' : 'border-border hover:bg-surface-muted',
                )}
              >
                <span className="flex -space-x-1" aria-hidden>
                  {[preset.colors.primary, preset.colors.secondary, preset.colors.accent].map((c) => (
                    <span key={c} className="size-4 rounded-full ring-2 ring-surface" style={{ background: c }} />
                  ))}
                </span>
                {preset.name}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_17rem]">
        <div className="space-y-5">
          {COLOR_GROUPS.map((group) => (
            <Group key={group.title} title={group.title}>
              {group.fields.map(({ key, label, hint }) => (
                <ColorField
                  key={key}
                  id={`theme-${key}`}
                  label={label}
                  hint={hint}
                  value={draft.colors[key]}
                  onChange={(v) => setColor(key, v)}
                />
              ))}
            </Group>
          ))}

          <Group title="More colours" note="Off = follow the colour named in brackets.">
            {EXTRA_FIELDS.map(({ key, label, hint, follows }) => {
              const value = draft.extras[key]
              return (
                <ColorField
                  key={key}
                  id={`theme-x-${key}`}
                  label={label}
                  hint={value ? hint : `(${follows})`}
                  value={value ?? '#cccccc'}
                  disabled={!value}
                  onChange={(v) => setExtra(key, v)}
                  trailing={
                    <Switch
                      checked={Boolean(value)}
                      onCheckedChange={(on) => setExtra(key, on ? (key === 'star' ? draft.colors.accent : draft.colors.primary) : null)}
                      aria-label={`Custom ${label} colour`}
                    />
                  }
                />
              )
            })}
          </Group>

          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-caption font-medium text-foreground">
              <Moon className="size-4" aria-hidden /> Dark mode
            </p>
            <Segmented
              options={MODES}
              value={draft.mode}
              onChange={(mode) => setDraft((d) => ({ ...d, mode }))}
              label="Colour mode"
            />
            <div className="grid gap-2 sm:grid-cols-3">
              <ColorField id="theme-dark-bg" label="Background" hint="Dark" value={draft.dark.background} onChange={(v) => setDark('background', v)} />
              <ColorField id="theme-dark-card" label="Cards" hint="Dark" value={draft.dark.surface} onChange={(v) => setDark('surface', v)} />
              <ColorField id="theme-dark-text" label="Text" hint="Dark" value={draft.dark.text} onChange={(v) => setDark('text', v)} />
            </div>
            <p className="text-small text-text-muted">
              Dark mode is new in the app — check a few pages after switching it on.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-caption font-medium text-foreground">
                <Shapes className="size-4" aria-hidden /> Corners
              </p>
              <Segmented
                options={RADII.map((r) => ({
                  value: r.value,
                  label: (
                    <span className="inline-flex items-center gap-1.5">
                      <span className={cn('inline-block size-3.5 border-2 border-current', r.preview)} aria-hidden />
                      {r.label}
                    </span>
                  ),
                }))}
                value={draft.radius}
                onChange={(radius) => setDraft((d) => ({ ...d, radius }))}
                label="Corner style"
              />
            </div>
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-caption font-medium text-foreground">
                <Type className="size-4" aria-hidden /> Text size
              </p>
              <Segmented
                options={TEXT_SIZES.map((t) => ({ value: t.value, label: <span className={t.sample}>{t.label}</span> }))}
                value={draft.textSize}
                onChange={(textSize) => setDraft((d) => ({ ...d, textSize }))}
                label="Text size"
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-caption font-medium text-foreground">
              <Type className="size-4" aria-hidden /> Fonts
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  ['font', 'Body text'],
                  ['headingFont', 'Headings'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="space-y-1 rounded-xl border border-border p-2.5">
                  <span className="text-caption font-medium text-foreground">{label}</span>
                  <select
                    value={draft[key]}
                    onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-body text-foreground focus:border-primary focus:outline-none"
                  >
                    {THEME_FONTS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <p className="text-small text-text-muted">
              Fonts other than Metropolis load from Google Fonts. Without internet the app falls back to Metropolis.
            </p>
          </div>
        </div>

        <ThemePreview />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          leftIcon={<RotateCcw className="size-4" />}
          disabled={isDefault}
          onClick={() => setDraft((d) => ({ ...DEFAULT_THEME, menuCardColors: d.menuCardColors, icon: d.icon }))}
        >
          Reset to default
        </Button>
        <div className="flex items-center gap-2">
          {dirty && <span className="text-small text-warning">Previewing — not saved</span>}
          <Button type="button" variant="outline" size="sm" disabled={!dirty || update.isPending} onClick={() => setDraft(saved)}>
            Discard
          </Button>
          <Button type="button" size="sm" disabled={!dirty} isLoading={update.isPending} onClick={save}>
            Save theme
          </Button>
        </div>
      </div>
    </Card>
  )
}

function CardTitle({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-caption text-text-secondary">{children}</p>
      </div>
    </div>
  )
}

function Group({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-caption font-medium text-foreground">
        {title}
        {note && <span className="ml-2 font-normal text-text-muted">{note}</span>}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">{children}</div>
    </div>
  )
}

/** Swatch + hex input. A half-typed hex stays local until it's valid. */
function ColorField({
  id,
  label,
  hint,
  value,
  onChange,
  disabled,
  trailing,
}: {
  id: string
  label: string
  hint: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  trailing?: ReactNode
}) {
  const [text, setText] = useState(value)
  useEffect(() => setText(value), [value])

  return (
    <div className={cn('flex items-center gap-3 rounded-xl border border-border p-2.5', disabled && 'opacity-60')}>
      <label
        className={cn('relative size-10 shrink-0 overflow-hidden rounded-lg ring-1 ring-border', disabled ? 'cursor-not-allowed' : 'cursor-pointer')}
        style={{ background: disabled ? undefined : value }}
      >
        {disabled && <span className="absolute inset-0 bg-[repeating-linear-gradient(45deg,var(--border)_0_4px,transparent_4px_8px)]" aria-hidden />}
        <input
          type="color"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          aria-label={`${label} colour`}
        />
      </label>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-baseline justify-between gap-2">
          <Label htmlFor={id} className="text-caption">{label}</Label>
          <span className="truncate text-small text-text-muted">{hint}</span>
        </div>
        <Input
          id={id}
          value={disabled ? 'Auto' : text}
          disabled={disabled}
          onChange={(e) => {
            const next = e.target.value.trim()
            setText(next)
            if (HEX.test(next)) onChange(next)
          }}
          aria-invalid={!disabled && !HEX.test(text)}
          className="h-8 px-2 font-mono text-small uppercase"
          maxLength={7}
        />
      </div>
      {trailing}
    </div>
  )
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: ReactNode }[]
  value: T
  onChange: (value: T) => void
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-xl bg-surface-muted p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'flex-1 rounded-lg px-2 py-1.5 text-caption font-medium transition-colors',
            value === o.value ? 'bg-surface text-foreground shadow-soft' : 'text-text-secondary hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** A small sample of the app, drawn with the live (draft) theme variables. */
function ThemePreview() {
  return (
    <div className="space-y-2 xl:sticky xl:top-4 xl:self-start">
      <p className="text-caption font-medium text-foreground">Preview</p>
      <div className="overflow-hidden rounded-2xl border border-border bg-background">
        <div className="flex items-center justify-between border-b border-border bg-header px-3 py-2">
          <span className="flex items-center gap-2">
            <Logo size={24} />
            <span className="text-caption font-semibold text-foreground">Listee</span>
          </span>
          <Search className="size-4 text-text-secondary" aria-hidden />
        </div>
        <div className="space-y-2 p-3">
          <div className="rounded-cover bg-gradient-to-br from-gradient-from to-gradient-to px-3 py-3 text-white">
            <p className="text-small opacity-90">Good evening</p>
            <p className="text-body font-bold">Rewards around you</p>
          </div>
          <div className="space-y-2 rounded-card bg-surface p-3 shadow-soft">
            <p className="text-subtitle font-bold leading-tight text-foreground">Masala Dosa</p>
            <p className="text-caption text-text-secondary">Crispy, golden and served with chutney.</p>
            <div className="flex flex-wrap gap-1">
              <Badge tone="success">Open now</Badge>
              <Badge className="bg-offer-soft text-offer">22% off</Badge>
              <Badge tone="warning">Popular</Badge>
              <Badge tone="danger">Sold out</Badge>
            </div>
            <div className="flex items-center gap-2 text-caption font-semibold text-foreground">
              <span className="inline-flex">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={cn('size-3.5', n <= 4 ? 'fill-star text-star' : 'text-border-strong')} aria-hidden />
                ))}
              </span>
              <Coins className="size-4 text-gold" aria-hidden /> +20
              <Sparkles className="size-4 text-gold" aria-hidden />
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1">Order</Button>
              <Button size="sm" variant="secondary" className="flex-1">Save</Button>
            </div>
          </div>
        </div>
        <div className="flex justify-around border-t border-border bg-nav py-2 text-small">
          <span className="flex flex-col items-center text-nav-active"><Home className="size-4" aria-hidden />Home</span>
          <span className="flex flex-col items-center text-text-muted"><Search className="size-4" aria-hidden />Search</span>
          <span className="flex flex-col items-center text-text-muted"><User className="size-4" aria-hidden />Profile</span>
        </div>
      </div>
    </div>
  )
}

/** On/off for tinting shop-page menu cards with each dish's colours. */
export function MenuCardColorsCard({ settings }: { settings: PlatformSettings }) {
  const update = useUpdateSettings()

  return (
    <Card elevation="soft" className="max-w-xl" padding="lg">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
          <UtensilsCrossed className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">Dish colours on shop menu cards</p>
          <p className="text-caption text-text-secondary">
            {settings.menuCardColors
              ? "On: each menu card glows in its dish's colours."
              : 'Off: menu cards stay plain white.'}{' '}
            Only the shop page cards — the full-screen dish view always keeps its colours.
          </p>
        </div>
        <Switch
          checked={settings.menuCardColors}
          disabled={update.isPending}
          onCheckedChange={(v) =>
            update.mutate(
              { menuCardColors: v },
              {
                onSuccess: () => toast.success(v ? 'Dish colours turned on' : 'Dish colours turned off'),
                onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Could not update.'),
              },
            )
          }
          aria-label="Dish colours on shop menu cards"
        />
      </div>
    </Card>
  )
}

/**
 * The app icon — browser tab, iPhone home screen and the installed app. Drawn
 * from the theme colours, or made from an uploaded image; only one is active.
 */
export function AppIconCard({ settings }: { settings: PlatformSettings }) {
  const update = useUpdateSettings()
  const { upload, remove } = useAppIconActions()
  const busy = update.isPending || upload.isPending || remove.isPending
  const version = settings.appIconVersion
  const src = (name: string) => (version ? `${appIconUrl(name)}?v=${version}` : null)
  const hasUpload = settings.appIconMode === 'upload'

  function onFile(file: File | undefined) {
    if (!file) return
    upload.mutate(file, {
      onSuccess: () => toast.success('App icon updated'),
      onError: (err) => {
        const first = err instanceof ApiError && err.errors ? Object.values(err.errors)[0]?.[0] : null
        toast.error(first ?? (err instanceof ApiError ? err.message : 'Could not upload the icon.'))
      },
    })
  }

  return (
    <Card elevation="soft" className="max-w-xl space-y-4" padding="lg">
      <CardTitle icon={<ImageUp className="size-5" aria-hidden />} title="App icon">
        Shown on the browser tab, the iPhone home screen and the installed app. Phones that already installed the
        app may keep the old icon: Android updates within a day or so, iPhone only after reinstalling.
      </CardTitle>

      <div role="radiogroup" aria-label="Icon source" className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          role="radio"
          aria-checked={!hasUpload}
          disabled={busy || !hasUpload}
          onClick={() =>
            update.mutate({ appIconMode: 'auto' }, { onSuccess: () => toast.success('Using the theme icon') })
          }
          className={cn(
            'flex items-start gap-2 rounded-xl border p-3 text-left',
            !hasUpload ? 'border-primary bg-primary-soft' : 'border-border hover:bg-surface-muted',
          )}
        >
          <Wand2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <span>
            <span className="block text-caption font-semibold text-foreground">From theme colours</span>
            <span className="text-small text-text-secondary">Redrawn whenever the theme changes.</span>
          </span>
        </button>
        <label
          className={cn(
            'flex cursor-pointer items-start gap-2 rounded-xl border p-3',
            hasUpload ? 'border-primary bg-primary-soft' : 'border-border hover:bg-surface-muted',
          )}
        >
          <ImageUp className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <span>
            <span className="block text-caption font-semibold text-foreground">
              {hasUpload ? 'Uploaded image (replace…)' : 'Upload an image'}
            </span>
            <span className="text-small text-text-secondary">Square PNG/JPG, 512 × 512 is best.</span>
          </span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            disabled={busy}
            onChange={(e) => {
              onFile(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </label>
      </div>

      {version && (
        <div className="flex flex-wrap items-end gap-5 rounded-xl bg-surface-muted p-4">
          <IconPreview src={src('icon-192')} label="App" size={64} />
          <IconPreview src={src('maskable-512')} label="Android" size={64} round />
          <IconPreview src={src('apple-180')} label="iPhone" size={64} squircle />
          <IconPreview src={src('icon-64')} label="Tab" size={24} />
        </div>
      )}

      {hasUpload && (
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Trash2 className="size-4" />}
          isLoading={remove.isPending}
          onClick={() => remove.mutate(undefined, { onSuccess: () => toast.success('Using the theme icon again') })}
        >
          Remove upload and use the theme icon
        </Button>
      )}
    </Card>
  )
}

function IconPreview({ src, label, size, round, squircle }: { src: string | null; label: string; size: number; round?: boolean; squircle?: boolean }) {
  if (!src) return null
  return (
    <span className="flex flex-col items-center gap-1">
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className={cn('shadow-soft', round && 'rounded-full', squircle && 'rounded-[22%]')}
      />
      <span className="text-small text-text-secondary">{label}</span>
    </span>
  )
}
