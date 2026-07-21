import { z } from 'zod'

/** Optional string that also accepts an empty field. */
const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(''))
const optionalEmail = z.email('Enter a valid email address').or(z.literal('')).optional()
const optionalUrl = z.url('Enter a valid URL (https://…)').or(z.literal('')).optional()
const optionalCoord = z
  .string()
  .trim()
  .refine((v) => v === '' || !Number.isNaN(Number(v)), 'Enter a valid number')
  .optional()
  .or(z.literal(''))

/**
 * Validation for the business registration / profile form
 * (document/phase/07 §Business Profile). Kept in sync with the backend
 * StoreBusinessRequest rules.
 */
export const businessSchema = z.object({
  name: z.string().trim().min(2, 'Business name is required').max(255),
  category: z.string().min(1, 'Please choose a category'),
  description: optionalText(2000),
  phone: optionalText(32),
  email: optionalEmail,
  website: optionalUrl,
  address: optionalText(500),
  latitude: optionalCoord,
  longitude: optionalCoord,
  openingTime: z.string().optional().or(z.literal('')),
  closingTime: z.string().optional().or(z.literal('')),
  // Social links accept any handle or URL — no strict URL validation.
  facebook: optionalText(255),
  instagram: optionalText(255),
  whatsapp: optionalText(32),
  gst: optionalText(32),
})

export type BusinessSchema = z.infer<typeof businessSchema>

export const businessFormDefaults: BusinessSchema = {
  name: '',
  category: '',
  description: '',
  phone: '',
  email: '',
  website: '',
  address: '',
  latitude: '',
  longitude: '',
  openingTime: '',
  closingTime: '',
  facebook: '',
  instagram: '',
  whatsapp: '',
  gst: '',
}

/** Fields validated at each wizard step (used with react-hook-form `trigger`). */
export const wizardStepFields: (keyof BusinessSchema)[][] = [
  ['name', 'category', 'description'],
  ['phone', 'email', 'website', 'address', 'latitude', 'longitude', 'openingTime', 'closingTime'],
  [], // media step — logo/cover handled outside RHF
  ['facebook', 'instagram', 'whatsapp', 'gst'],
]
