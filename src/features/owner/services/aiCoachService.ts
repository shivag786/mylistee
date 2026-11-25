/**
 * The AI sales manager bubble. `coach` (tips, usage, a rationed nudge) costs
 * no AI tokens; only `generate` calls the AI and counts against the shop's
 * monthly AI answers.
 */
import { apiClient } from '@/services/apiClient'

export type AiTaskKind =
  | 'ask'
  | 'offer_ideas'
  | 'combo_ideas'
  | 'sales_tips'
  | 'push_message'
  | 'product_description'
  | 'review_reply'

export type CoachRoute = 'menuScan' | 'products' | 'offers' | 'qr' | 'reviews' | 'advisor' | 'combos' | 'notify'

export interface CoachTip {
  id: string
  score: number
  title: string
  text: string
  action:
    | { type: 'route'; route: CoachRoute; label: string }
    | { type: 'ai'; task: AiTaskKind; input?: Record<string, string>; label: string }
}

/** This month's AI answers: the plan's first, then bought ones. */
export interface AiUsage {
  planLimit: number | null
  planUsed: number
  addonUsed: number
  credits: number
  left: number | null
  used: number
  limit: number
  unlimited: boolean
}

export interface CoachOverview extends Omit<AiUsage, 'left'> {
  available: boolean
  inPlan: boolean
  left: number
  resetsOn: string
  pendingIdeas: number
  tips: CoachTip[]
  nudge: CoachTip | null
}

/** One AI answer item; the shape depends on the task. */
export interface AiAnswer {
  text?: string
  steps?: string[]
  title?: string
  body?: string
  description?: string
  name?: string
  items?: string[]
  price?: number
  why?: string
  type?: string
  rewardValue?: string
}

export interface AiGenerateResult extends Partial<AiUsage> {
  suggestions: AiAnswer[]
}

export interface AiPack {
  id: string
  name: string
  answers: number
  price: number
  perAnswer: number | null
  isActive: boolean
  position: number
}

export interface AiCredits {
  inPlan: boolean
  usage: AiUsage
  resetsOn: string
  packs: AiPack[]
  paymentsLive: boolean
  purchases: { id: string; pack: string; answers: number; amount: number; paidAt: string | null }[]
}

export interface AiPackCheckout {
  paymentId: string
  keyId: string
  orderId: string
  amount: number
  amountDisplay: number
  currency: string
  name: string
  description: string
  themeColor: string | null
  logo: string | null
  prefill: { name?: string; email?: string; contact?: string }
  notes: Record<string, string>
}

export const aiCoachService = {
  overview(nudge = false): Promise<CoachOverview> {
    return apiClient.get<CoachOverview>('business/coach', { query: nudge ? { nudge: 1 } : undefined })
  },
  record(action: 'dismiss' | 'open', tipId?: string): Promise<unknown> {
    return apiClient.post('business/coach/nudge', { action, tipId })
  },
  credits(): Promise<AiCredits> {
    return apiClient.get<AiCredits>('business/ai-credits')
  },
  checkoutPack(packId: string): Promise<AiPackCheckout> {
    return apiClient.post<AiPackCheckout>('business/ai-credits/checkout', { packId })
  },
  verifyPack(body: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) {
    return apiClient.post<{ credited: number; credits: number; usage: AiUsage }>('business/ai-credits/verify', body)
  },
  generate(kind: AiTaskKind, input: Record<string, string> = {}): Promise<AiGenerateResult> {
    return apiClient.post<AiGenerateResult>('business/ai/generate', { kind, input }, { timeoutMs: 90_000 })
  },
}
