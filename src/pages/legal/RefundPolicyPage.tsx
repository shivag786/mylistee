import { Link } from 'react-router-dom'
import { LegalPage, Section, P, UL, DL, Callout } from '@/components/legal/LegalPage'
import { ROUTES } from '@/constants/routes'
import { LEGAL } from '@/config/legal'

/**
 * Refund & Cancellation Policy.
 *
 * The distinction this page exists to make: Listee only ever refunds a *plan
 * fee*, because that is the only money Listee collects. Orders are paid to the
 * business at the counter, so an order refund is between the customer and that
 * business. Do not blur that line when editing — it is also what the backend
 * enforces (refunds run against a Razorpay plan payment, nothing else).
 *
 * The day counts come from `src/config/legal.ts` so this page and the operational
 * settings can never drift apart.
 */
export function RefundPolicyPage() {
  const { coolingOffDays, decisionDays, settlementDays } = LEGAL.refund

  return (
    <LegalPage
      title="Refund &amp; Cancellation Policy"
      summary="When a business plan payment can be cancelled or refunded, how long it takes, and where order refunds are handled instead."
    >
      <Section heading="1. What this policy covers">
        <P>
          This policy covers{' '}
          <strong className="text-foreground">business plan subscriptions</strong> bought from{' '}
          {LEGAL.brand} — the Starter, Pro and Enterprise plans, paid through Razorpay. That is the
          only payment {LEGAL.brand} collects.
        </P>
        <Callout>
          It does not cover food or goods you order through {LEGAL.brand}. You pay the shop directly
          for those, so a refund for an order is arranged with the shop — see section 6.
        </Callout>
      </Section>

      <Section heading="2. Before you pay">
        <P>
          Every plan&apos;s price and limits are shown on the Plan &amp; billing screen before you
          confirm, and the free plan lets you use {LEGAL.brand} for as long as you like before
          upgrading. We ask you to try the free plan first — it is the cheapest way to be sure a
          paid plan is right for your shop.
        </P>
        <P>
          <strong className="text-foreground">Plans do not auto-renew.</strong> You pay once per
          billing period. Nothing is charged again unless you choose to pay again, so there is no
          renewal to cancel and no surprise debit.
        </P>
      </Section>

      <Section heading="3. Cancelling a plan">
        <P>
          You can cancel at any time from Plan &amp; billing. Cancelling stops future billing and
          keeps your paid features running until the end of the period you already paid for — after
          which your business moves to the Free plan automatically.
        </P>
        <P>
          Nothing you created is deleted on a downgrade. If your content exceeds the Free
          plan&apos;s limits, the excess is simply deactivated — newest kept — and becomes active
          again the moment you upgrade.
        </P>
        <P>Cancelling on its own does not trigger a refund. Refunds are covered next.</P>
      </Section>

      <Section heading="4. When we refund">
        <P>We refund a plan payment in these cases:</P>
        <UL>
          <li>
            <strong className="text-foreground">
              First purchase, within {coolingOffDays} days.
            </strong>{' '}
            If this is the first paid plan for your business and you are not satisfied, ask within{' '}
            {coolingOffDays} days of payment and we refund it in full.
          </li>
          <li>
            <strong className="text-foreground">Duplicate or double charge.</strong> If you were
            charged more than once for the same period, the extra payment is refunded in full.
          </li>
          <li>
            <strong className="text-foreground">Charged but not activated.</strong> If money left
            your account and your plan did not go live, we refund it in full — usually
            automatically, without you having to ask.
          </li>
          <li>
            <strong className="text-foreground">A failure on our side.</strong> If a fault in{' '}
            {LEGAL.brand} made your paid features unusable for a meaningful stretch of the period
            and we could not fix it, we refund the affected part of the period pro rata.
          </li>
          <li>
            <strong className="text-foreground">We end your plan without cause.</strong> If we
            withdraw a plan or close your account for a reason that is not a breach of our{' '}
            <Link to={ROUTES.terms} className="font-medium text-primary underline">
              Terms
            </Link>
            , we refund the unused period pro rata.
          </li>
        </UL>
      </Section>

      <Section heading="5. When we do not refund">
        <UL>
          <li>
            A period you have already used, simply because you changed your mind after the{' '}
            {coolingOffDays}-day window.
          </li>
          <li>
            Not using the features you paid for. Access is what the plan buys, and it was available.
          </li>
          <li>
            Downgrading or cancelling part-way through a period — you keep the plan until the period
            ends instead.
          </li>
          <li>
            An account suspended or closed for breaking our{' '}
            <Link to={ROUTES.terms} className="font-medium text-primary underline">
              Terms
            </Link>{' '}
            — for example fraud, fake reviews or manipulating rewards.
          </li>
          <li>
            Outages caused by things outside our control, such as your internet connection or a
            third-party provider.
          </li>
          <li>
            {LEGAL.brand} Coins and rewards, which have no cash value and are never refundable.
          </li>
        </UL>
      </Section>

      <Section heading="6. Orders, rewards and coins">
        <P>
          <strong className="text-foreground">Orders.</strong> {LEGAL.brand} passes your order to
          the shop; you pay the shop directly, in cash or through its own payment terminal.{' '}
          {LEGAL.brand} never receives that money, so we cannot refund it. Contact the shop using
          the details on its {LEGAL.brand} profile. If a shop repeatedly refuses a fair refund, tell
          us at{' '}
          <a href={`mailto:${LEGAL.supportEmail}`} className="font-medium text-primary underline">
            {LEGAL.supportEmail}
          </a>{' '}
          — we investigate and can suspend a listing, even though we cannot return money we never
          held.
        </P>
        <P>
          <strong className="text-foreground">Rewards and coins.</strong> Rewards are issued and
          honoured by the business. Coins are loyalty points, not money: they cannot be converted to
          cash, withdrawn or refunded. If a reward was voided by a genuine platform error, tell us
          and we will restore it where we can.
        </P>
      </Section>

      <Section heading="7. How to request a refund">
        <P>
          Email{' '}
          <a href={`mailto:${LEGAL.supportEmail}`} className="font-medium text-primary underline">
            {LEGAL.supportEmail}
          </a>{' '}
          from the address on your {LEGAL.brand} account, with:
        </P>
        <UL>
          <li>your business name as it appears on {LEGAL.brand};</li>
          <li>the invoice number from Plan &amp; billing (for example INV-2026-000042);</li>
          <li>the date and amount of the payment;</li>
          <li>what went wrong.</li>
        </UL>
      </Section>

      <Section heading="8. How long it takes">
        <DL
          items={[
            { term: 'Acknowledgement', detail: 'Within 48 hours of your request' },
            { term: 'Decision', detail: `Within ${decisionDays} working days` },
            {
              term: 'Money back',
              detail: `Within ${settlementDays} working days of approval, to the original payment method`,
            },
            {
              term: 'Method',
              detail:
                'Always the same method you paid with — we do not refund to a different account',
            },
            { term: 'Currency', detail: 'Indian Rupees (₹), the amount actually charged' },
          ]}
        />
        <P>
          Once we approve a refund we submit it to Razorpay immediately. How quickly it appears in
          your account then depends on your bank or UPI provider — typically 5–7 working days, and
          your invoice is marked refunded as soon as we submit it.
        </P>
        <P>
          A full refund also ends the plan straight away and moves your business to the Free plan. A
          partial refund is a goodwill adjustment and leaves your plan running.
        </P>
      </Section>

      <Section heading="9. Failed and pending payments">
        <P>
          If a payment fails, no plan is activated and no money is captured. Where a bank shows an
          amount as debited on a failed attempt, it is normally an authorisation hold that your bank
          releases within 5–7 working days without any action from us. If it has not cleared after
          that, send us the payment reference and we will trace it with Razorpay.
        </P>
      </Section>
    </LegalPage>
  )
}
