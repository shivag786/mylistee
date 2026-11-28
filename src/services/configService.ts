/** Public app config (GET /config) — feature flags + the order-alert sound. */
import { apiClient } from '@/services/apiClient'
import type { BrandTheme } from '@/features/brandTheme/brandTheme'
import type { HomeSectionSetting } from '@/features/home/homeSections'
import type { LandingContent } from '@/features/landing/landingContent'
import type { SeoSettings } from '@/features/seo/seoTypes'

export interface AppConfig {
  flags: {
    homeCategoryFilter: boolean
    /**
     * Whether this app behaves as an installable PWA at all. Off means no
     * install banner, no service worker, and no manifest — see PwaController.
     */
    pwa: boolean
  }
  /** Admin-set new-order alert sound for owners (null = built-in ding). */
  orderSoundUrl: string | null
  /** Which owner-menu modules are enabled (admin-controlled). Missing key ⇒ on. */
  ownerModules: Record<string, boolean>
  /** Play Store pages of the customer and vendor apps ('' = not set). Absent on an older API. */
  apps?: { customerPlayStore: string; vendorPlayStore: string }
  /** How the public reaches the Listee team. */
  support?: { email: string; phone: string }
  /** Coins a new customer gets on sign-up (shown on the "get the app" prompt). */
  welcomeCoins?: number
  /**
   * Whether a live payment gateway is configured on the server — a boolean only,
   * never a key. False in local development without Razorpay credentials, where
   * a paid upgrade falls back to the pre-gateway simulated switch instead of
   * opening Checkout.
   */
  payments: {
    razorpay: boolean
    /** Convenience fee on the online share of an order, in percent. */
    convenienceFeePercent?: number
    /** Listee's cut of every order, borne by the shop. */
    platformFeePercent?: number
    /** The payment gateway's cut of the online part, borne by the shop. */
    gatewayFeePercent?: number
  }
  /**
   * Which ways in the customer login page offers. The server keeps at least one
   * on. Absent on an older API, which only had Google.
   */
  auth?: { google: boolean; mobile: boolean; /** "Forgot PIN?" by a WhatsApp code is available. */ whatsappOtp?: boolean }
  /** ₹ per coin, and the coins a new account starts with. */
  coins?: { enabled?: boolean; value: number; welcome: number }
  /** The admin's Rewards & coupons switch (shop rewards for customers). */
  rewardsEnabled?: boolean
  /** Admin-set colours/fonts and the menu-card colour switch. Absent on an older API. */
  theme?: BrandTheme
  /** Admin-arranged home sections; null/absent = the built-in order. */
  homeLayout?: HomeSectionSetting[] | null
  /** What `/` shows signed-out visitors. Absent on an older API = the shop feed. */
  homePage?: 'shops' | 'landing' | 'join'
  /** Admin-edited landing page content; null = the built-in content. */
  landingPage?: LandingContent | null
  /** Admin-set search and social tags; null = the built-in ones. */
  seo?: SeoSettings | null
  /** Personal link trial and pack prices (₹), for the landing page. */
}

export const configService = {
  get: () => apiClient.get<AppConfig>('config'),
}
