import { Link } from 'react-router-dom'
import { LegalPage, Section, P, UL, Callout } from '@/components/legal/LegalPage'
import { ROUTES } from '@/constants/routes'
import { LEGAL } from '@/config/legal'

/**
 * Terms & Conditions.
 *
 * Written against what the product actually does, not a generic template. The
 * two facts that shape everything here:
 *
 *  1. Listee is an intermediary. Customers order and redeem rewards *from
 *     businesses*; we never sell the goods and never take the customer's money
 *     for them.
 *  2. The only money Listee collects is a business owner's plan fee.
 *
 * Keep it that way when editing — a clause that implies we sell food or hold
 * customer funds would be untrue and would change our legal exposure.
 */
export function TermsPage() {
  return (
    <LegalPage
      title="Terms &amp; Conditions"
      summary={`The rules for using ${LEGAL.brand} — as a customer discovering local shops, or as a business owner listing one.`}
    >
      <Section heading="1. Who we are">
        <P>
          In these terms, “we”, “us” and “{LEGAL.brand}” mean the operator of the {LEGAL.brand}{' '}
          platform, and “you” means anyone using it — whether through the web app, the installed
          app, or a QR code at a shop.
        </P>
        <P>
          By creating an account, scanning a {LEGAL.brand} QR code, or using any part of the
          platform, you agree to these terms, to our{' '}
          <Link to={ROUTES.privacy} className="font-medium text-primary underline">
            Privacy Policy
          </Link>{' '}
          and, if you buy a plan, to our{' '}
          <Link to={ROUTES.refund} className="font-medium text-primary underline">
            Refund &amp; Cancellation Policy
          </Link>
          . If you do not agree, please do not use {LEGAL.brand}.
        </P>
      </Section>

      <Section heading="2. What Listee is — and what it is not">
        <P>
          {LEGAL.brand} is a discovery and loyalty platform. We help you find local businesses, and
          we give those businesses tools to run offers, rewards and a menu. We are an intermediary
          under the Information Technology Act, 2000 and an “e-commerce entity” in the marketplace
          model under the Consumer Protection (E-Commerce) Rules, 2020.
        </P>
        <Callout>
          We do not sell, prepare, deliver or guarantee anything a business offers. Every product,
          price, offer, reward and delivery is the responsibility of the business that listed it.
          Your purchase contract is with that business, not with {LEGAL.brand}.
        </Callout>
        <P>
          Business listings may include information imported from public sources such as Google
          Business Profiles. We show it as a convenience and do not warrant that it is current.
        </P>
      </Section>

      <Section heading="3. Your account">
        <UL>
          <li>
            You must be at least 18, or use {LEGAL.brand} with the consent and supervision of a
            parent or guardian.
          </li>
          <li>
            Customer accounts are created with Google Sign-In. Business owner and staff accounts use
            a mobile number and a PIN.
          </li>
          <li>
            Keep your PIN and your device secure. Anything done through your account is treated as
            done by you, so tell us immediately at{' '}
            <a href={`mailto:${LEGAL.supportEmail}`} className="font-medium text-primary underline">
              {LEGAL.supportEmail}
            </a>{' '}
            if you suspect someone else has access.
          </li>
          <li>
            One person, one account. Accounts are personal and may not be sold or transferred.
          </li>
        </UL>
      </Section>

      <Section heading="4. Orders you place through Listee">
        <P>
          When you place an order, {LEGAL.brand} passes it to the business and shows you its status.
          That is the whole of our role.
        </P>
        <UL>
          <li>
            <strong className="text-foreground">You pay the business directly</strong> — in cash, or
            by the shop&apos;s own UPI/card terminal, at the counter or on delivery. {LEGAL.brand}
            does not collect, hold or process money for orders.
          </li>
          <li>
            A business may decline or cancel an order — for example if an item is unavailable or it
            is closing. Prices, taxes and availability shown in the app are set by the business.
          </li>
          <li>
            Questions about a wrong, late, missing or unsatisfactory order go to the business first.
            Its contact details are on its {LEGAL.brand} profile. We will help you reach them, and
            we act on repeated complaints — but we cannot refund money we never received.
          </li>
        </UL>
      </Section>

      <Section heading="5. Rewards, spins and Listee Coins">
        <P>
          Rewards come from the businesses themselves. A spin draws from the offers that business
          has made live, and the reward you win is redeemed at that business, on its terms.
        </P>
        <UL>
          <li>
            One spin per business per day. The result is decided on our servers, not in the app.
          </li>
          <li>
            Every reward has an expiry. Once it lapses it cannot be reinstated, extended or
            exchanged.
          </li>
          <li>
            {LEGAL.brand} Coins are loyalty points, not money and not a payment instrument. They
            have no cash value, cannot be withdrawn, transferred, gifted or sold, and may be applied
            only as a discount within {LEGAL.brand}.
          </li>
          <li>
            Coins earned in error, through a bug, or through manipulation of the spin, check-in or
            review mechanics may be reversed, and the account may be suspended.
          </li>
          <li>
            We may change earn rates, caps and expiry rules. Coins already in your balance keep
            their value at the time you spend them.
          </li>
        </UL>
        <P>
          A business may close or leave {LEGAL.brand}. If it does, unredeemed rewards and coins for
          that business can no longer be used, and {LEGAL.brand} is not liable for their value.
        </P>
      </Section>

      <Section heading="6. If you list a business">
        <P>
          By registering a business, you confirm you are authorised to represent it, and you agree
          to:
        </P>
        <UL>
          <li>
            keep your listing accurate — name, address, hours, contact details, prices, taxes, food
            type and licence or GST details where they apply;
          </li>
          <li>
            honour every offer, combo, promotion and reward you publish, on the terms you published
            them, for as long as they are live;
          </li>
          <li>
            upload only images and text you have the right to use, and nothing misleading, offensive
            or unlawful;
          </li>
          <li>
            hold the licences and registrations your trade requires, and comply with the law that
            applies to it — including food safety, weights and measures, and tax;
          </li>
          <li>
            handle customer data you receive through {LEGAL.brand} only to serve those customers,
            and never sell it on;
          </li>
          <li>
            never manipulate reviews, ratings or redemption records, whether your own or a
            competitor&apos;s.
          </li>
        </UL>
        <P>
          You keep ownership of your content. You grant us a non-exclusive, royalty-free licence to
          host, resize and display it inside {LEGAL.brand} and in {LEGAL.brand} marketing, for as
          long as your listing is live.
        </P>
      </Section>

      <Section heading="7. Plans, pricing and payment">
        <P>
          Business features are available on a free plan and on paid plans. Each plan sets its own
          limits — how many offers, combos, promotions, QR codes and gallery images you can keep
          active, and how long an offer may run. Current plans and prices are shown on the Plan
          &amp; billing screen.
        </P>
        <UL>
          <li>
            All prices are in Indian Rupees (₹) and include applicable taxes unless stated
            otherwise.
          </li>
          <li>
            Payments are processed by <strong className="text-foreground">Razorpay</strong>. We
            never see or store your card, UPI or bank credentials.
          </li>
          <li>
            <strong className="text-foreground">Plans do not auto-renew.</strong> You pay once per
            billing period and choose whether to pay again. Your plan runs from the moment the
            payment is confirmed until the end of that period.
          </li>
          <li>
            An invoice is generated for every successful payment and stays in your billing history.
          </li>
          <li>
            If you move to a smaller plan, anything above the new limits is deactivated — newest
            kept — but never deleted. It becomes active again if you upgrade.
          </li>
          <li>
            We may change plan prices or limits. A change never affects a period you have already
            paid for, and we will tell you before the next one.
          </li>
        </UL>
        <P>
          Cancellations and refunds are governed by our{' '}
          <Link to={ROUTES.refund} className="font-medium text-primary underline">
            Refund &amp; Cancellation Policy
          </Link>
          .
        </P>
      </Section>

      <Section heading="8. Reviews and content you post">
        <P>
          Reviews must reflect a genuine experience. Do not post anything false, defamatory,
          obscene, hateful, infringing, or that reveals someone else&apos;s personal information. Do
          not post on behalf of a business you own or compete with.
        </P>
        <P>
          We may remove content, hide a listing, or suspend an account that breaks these rules.
          Where the law allows, we will tell you why.
        </P>
      </Section>

      <Section heading="9. Things you must not do">
        <UL>
          <li>
            Use bots, scripts or automation to spin, earn coins, place orders or scrape the
            platform.
          </li>
          <li>Create multiple accounts to collect rewards more than once.</li>
          <li>
            Probe, scan or test the security of our systems, or try to bypass authentication or rate
            limits.
          </li>
          <li>
            Reverse-engineer the app, or copy any part of it, except where the law expressly
            permits.
          </li>
          <li>
            Interfere with another user&apos;s use of the platform, or misuse another
            business&apos;s QR codes.
          </li>
        </UL>
      </Section>

      <Section heading="10. Availability and changes">
        <P>
          We work to keep {LEGAL.brand} available, but we do not promise uninterrupted service. We
          may add, change, suspend or withdraw features, run maintenance, or enable and disable
          functionality for particular accounts. Where a change materially reduces what a paid plan
          includes, we will tell you and you may ask for a pro-rata refund of the unused period.
        </P>
      </Section>

      <Section heading="11. Our liability">
        <P>
          Nothing here limits liability that cannot be limited by law — including for fraud, or for
          death or personal injury caused by negligence. Subject to that:
        </P>
        <UL>
          <li>
            {LEGAL.brand} is provided “as is”. We do not warrant that listings, offers, prices or
            ratings are accurate, or that a business will honour a reward.
          </li>
          <li>
            We are not liable for the quality, safety or legality of anything a business sells, nor
            for a dispute between you and a business.
          </li>
          <li>
            We are not liable for indirect or consequential loss, or for loss of profit, goodwill or
            data.
          </li>
          <li>
            Our total liability to you for any claim is capped at the amount you paid us in the
            twelve months before the claim arose — which, for customers, is nil, because customers
            do not pay {LEGAL.brand}.
          </li>
        </UL>
      </Section>

      <Section heading="12. Suspension and closing your account">
        <P>
          You may stop using {LEGAL.brand} at any time and ask us to delete your account (see the{' '}
          <Link to={ROUTES.privacy} className="font-medium text-primary underline">
            Privacy Policy
          </Link>
          ). We may suspend or close an account that breaks these terms, is used fraudulently, or
          exposes us or our users to legal risk.
        </P>
        <P>
          On closure, unredeemed rewards and coin balances are forfeited and cannot be converted to
          cash. A paid plan that we terminate without cause is refunded pro rata for the unused
          period.
        </P>
      </Section>

      <Section heading="13. Governing law">
        <P>
          These terms are governed by the laws of India. The courts at {LEGAL.jurisdiction} have
          exclusive jurisdiction, without prejudice to any right you have as a consumer to bring
          proceedings where you live.
        </P>
      </Section>

      <Section heading="14. Changes to these terms">
        <P>
          We may update these terms. The date at the top of this page always shows the current
          version, and we will notify you in the app before a material change takes effect.
          Continuing to use {LEGAL.brand} after that means you accept the updated terms.
        </P>
      </Section>
    </LegalPage>
  )
}
