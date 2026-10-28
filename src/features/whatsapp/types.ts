/** WhatsApp (Interakt) shapes, as the admin and owner WhatsApp APIs speak them. */

export type TemplateStatus = 'APPROVED' | 'WAITING' | 'PENDING' | 'REJECTED' | 'PAUSED' | 'DISABLED' | string
export type TemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'

/** Where a {{n}} gets its value (see WhatsAppTemplateService::SOURCES). */
export interface TemplateVar {
  source: string
  /** What the shop owner sees for a `custom` blank. */
  label?: string
  /** The text for a `fixed` blank. */
  value?: string
  /** Example Meta reviews the template with. */
  sample?: string
}

export interface TemplateButton {
  type: 'URL' | 'PHONE_NUMBER' | 'QUICK_REPLY' | 'OTP' | string
  text?: string
  url?: string
  phone_number?: string
  var?: TemplateVar
}

export interface TemplateVariables {
  header: TemplateVar | null
  body: TemplateVar[]
  /** Button index → its blank. */
  buttons: Record<string, TemplateVar>
}

export interface WaTemplate {
  id: string
  name: string
  displayName: string
  language: string
  category: TemplateCategory
  headerFormat: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | null
  header: string | null
  headerMediaUrl: string | null
  body: string
  footer: string | null
  buttons: TemplateButton[]
  variables: TemplateVariables
  forShops: boolean
  status: TemplateStatus
  rejectionReason: string | null
  source: 'listee' | 'interakt'
  syncedAt: string | null
  createdAt: string | null
}

export interface WaSource {
  key: string
  label: string
  /** all | order | otp | shop | image */
  for: string
  sample: string
}

export interface WaEvent {
  key: string
  label: string
  to: 'customer' | 'shop'
  hint: string
}

export interface WaPreset {
  key: string
  title: string
  name: string
  category: 'MARKETING' | 'UTILITY'
  forShops: boolean
  event?: string
  header: { format: 'TEXT'; text: string; var?: TemplateVar } | null
  body: string
  bodyVars: TemplateVar[]
  footer: string | null
  buttons: TemplateButton[]
}

export interface WaSettings {
  enabled: boolean
  apiKeySet: boolean
  webhookSecretSet: boolean
  countryCode: string
  events: Record<string, string>
}

export interface WaAdminState {
  settings: WaSettings
  webhookUrl: string
  templates: WaTemplate[]
  events: WaEvent[]
  sources: WaSource[]
  presets: WaPreset[]
  languages: Record<string, string>
  month: { sent: number; delivered: number; read: number; failed: number }
}

export interface WaMessage {
  id: string
  phone: string
  purpose: string
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed'
  error: string | null
  template: string | null
  business: string | null
  createdAt: string | null
  updatedAt: string | null
}

/** How many {{n}} blanks a text has (the highest n). */
export function countBlanks(text: string | null | undefined): number {
  const nums = [...(text ?? '').matchAll(/\{\{\s*(\d+)\s*\}\}/g)].map((m) => Number(m[1]))
  return nums.length ? Math.max(...nums) : 0
}

export const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  APPROVED: 'success',
  WAITING: 'warning',
  PENDING: 'warning',
  IN_APPEAL: 'warning',
  REJECTED: 'danger',
  PAUSED: 'danger',
  DISABLED: 'danger',
}

export const STATUS_LABEL: Record<string, string> = {
  APPROVED: 'Approved',
  WAITING: 'Waiting for approval',
  PENDING: 'Waiting for approval',
  REJECTED: 'Rejected',
  PAUSED: 'Paused by WhatsApp',
  DISABLED: 'Disabled by WhatsApp',
}

/** The sample shown in previews for a blank. */
export function sampleFor(v: TemplateVar | undefined, sources: WaSource[]): string {
  if (!v) return ''
  if (v.source === 'fixed') return v.value ?? ''
  if (v.source === 'custom') return v.sample || (v.label ? `[${v.label}]` : '')
  return v.sample || sources.find((s) => s.key === v.source)?.sample || ''
}
