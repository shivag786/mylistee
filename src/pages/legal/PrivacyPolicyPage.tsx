import { LegalPage, Section, P, UL, DL, Callout } from '@/components/legal/LegalPage'
import { LEGAL } from '@/config/legal'

/**
 * Privacy Policy.
 *
 * Every claim here is meant to match the code. If you change what the platform
 * collects or who it sends data to, change this page in the same commit —
 * particularly §3 (what we collect), §5 (who we share it with) and §7
 * (retention). The current third parties are Firebase Auth + FCM, Razorpay,
 * Google Places (admin business import) and Anthropic (offer suggestions).
 */
export function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      summary={`What ${LEGAL.brand} collects, why, who else sees it, and how to get it deleted.`}
    >
      <Section heading="1. The short version">
        <UL>
          <li>We collect what we need to sign you in, show you nearby shops, and run rewards.</li>
          <li>We do not sell your personal data, and we do not run third-party ad tracking.</li>
          <li>We never see your card, UPI or bank details — Razorpay handles payments.</li>
          <li>You can ask us to delete your account and data at any time.</li>
        </UL>
      </Section>

      <Section heading="2. Who is responsible for your data">
        <P>
          The operator of {LEGAL.brand} is the data fiduciary for personal data processed through
          the platform — meaning we decide why and how it is used, under the Digital Personal Data
          Protection Act, 2023 and the Information Technology Act, 2000.
        </P>
        <P>
          A business you interact with is separately responsible for what it does with the customer
          information it receives through {LEGAL.brand}, such as your name against an order or a
          redemption.
        </P>
      </Section>

      <Section heading="3. What we collect">
        <P>
          <strong className="text-foreground">When you sign in as a customer.</strong> Google
          Sign-In gives us your name, email address and profile photo. We store a {LEGAL.brand}{' '}
          account record; we never receive your Google password.
        </P>
        <P>
          <strong className="text-foreground">
            When you sign in as a business owner or staff.
          </strong>{' '}
          Your name, mobile number, email address and a PIN you choose. The PIN is stored hashed.
        </P>
        <P>
          <strong className="text-foreground">When you use the app.</strong> The shops you open,
          scan, favourite and check in to; your spins and the rewards you win; your {LEGAL.brand}{' '}
          Coins balance and the events that changed it; orders you place, including items, amounts
          and status; reviews and ratings you write; and your notification preferences.
        </P>
        <P>
          <strong className="text-foreground">When you list a business.</strong> Business name,
          owner name, description, address and map coordinates, opening hours, phone, email, website
          and social links, GST number where you provide one, logo, cover and gallery images, your
          menu, tables, combos, offers and promotions.
        </P>
        <P>
          <strong className="text-foreground">When you buy a plan.</strong> The plan, amount,
          currency, and the Razorpay order, payment and refund identifiers, plus the payment method
          type (for example “UPI” or “card”). We store these to issue invoices and handle refunds.{' '}
          <strong className="text-foreground">
            We never receive your full card number, CVV, UPI PIN or bank credentials.
          </strong>
        </P>
        <P>
          <strong className="text-foreground">Technical data.</strong> IP address, device and
          browser information, and a device token if you allow push notifications. Administrative
          actions on the platform are written to an audit log with the acting account and IP
          address.
        </P>
        <P>
          <strong className="text-foreground">Location.</strong> {LEGAL.brand} asks for your device
          location in one place only: when a business owner taps “use my location” to pin their shop
          on the map. That is a one-off reading you have to trigger, and you can type the address
          instead. We do not track customer location in the background.
        </P>
        <Callout>
          Please do not put sensitive personal data — health, financial, caste, religious or
          biometric information — into reviews, order notes or business descriptions. Those fields
          are meant to be public and are not designed to hold it.
        </Callout>
      </Section>

      <Section heading="4. Why we use it, and on what basis">
        <UL>
          <li>
            <strong className="text-foreground">To run your account and the service</strong> —
            signing you in, showing shops, running spins, tracking coins, passing orders to a
            business. This is necessary to provide what you asked for.
          </li>
          <li>
            <strong className="text-foreground">To take payment for plans</strong> and issue
            invoices — necessary to perform our contract with a business owner, and to meet tax and
            accounting obligations.
          </li>
          <li>
            <strong className="text-foreground">To send notifications</strong> about your orders,
            rewards and account. Marketing and broadcast notifications are sent only with your
            consent and can be turned off on your device or in the app.
          </li>
          <li>
            <strong className="text-foreground">To keep the platform safe</strong> — detecting
            duplicate accounts, spin and coin abuse, and fake reviews, and keeping an audit trail of
            administrative actions.
          </li>
          <li>
            <strong className="text-foreground">To improve {LEGAL.brand}</strong> using aggregated
            statistics that do not identify you.
          </li>
        </UL>
        <P>
          We do not use your personal data for automated decisions that produce legal effects, and
          we do not profile you for third-party advertising.
        </P>
      </Section>

      <Section heading="5. Who else sees your data">
        <P>
          We share only what each recipient needs, and only for the purpose listed. We do not sell
          personal data.
        </P>
        <DL
          items={[
            {
              term: 'The business you interact with',
              detail:
                'Your name and the details of your order, reward or review — so it can serve you and honour the reward.',
            },
            {
              term: 'Google (Firebase)',
              detail:
                'Authentication for Google Sign-In, and Firebase Cloud Messaging to deliver push notifications to your device.',
            },
            {
              term: 'Razorpay',
              detail:
                'Plan payments. You enter your payment details on Razorpay, not on Listee; they return only the identifiers and status we need to confirm the payment.',
            },
            {
              term: 'Google Places',
              detail:
                'Used by our team to import publicly listed business information when onboarding a shop. No customer data is sent.',
            },
            {
              term: 'Anthropic',
              detail:
                "For AI offer suggestions, we send a business's name, category and its 30-day aggregate performance figures. No customer personal data is included.",
            },
            {
              term: 'Hosting and infrastructure',
              detail:
                'Providers who store and serve the platform under contract, bound to confidentiality.',
            },
            {
              term: 'Authorities',
              detail:
                'Where we are legally required to disclose, or to establish, exercise or defend a legal claim.',
            },
          ]}
        />
        <P>
          Some of these providers process data outside India. Where they do, we rely on their
          contractual data-protection commitments.
        </P>
      </Section>

      <Section heading="6. What is stored on your device">
        <UL>
          <li>
            <strong className="text-foreground">Your sign-in token</strong>, kept in browser storage
            so you stay signed in. Clearing site data or signing out removes it.
          </li>
          <li>
            <strong className="text-foreground">A service worker cache</strong>, so the app opens
            offline. It holds app files and images, not your account data.
          </li>
          <li>Small preferences such as your theme choice.</li>
        </UL>
        <P>We do not use advertising or cross-site tracking cookies.</P>
      </Section>

      <Section heading="7. How long we keep it">
        <UL>
          <li>Account and profile data: while your account is open.</li>
          <li>
            Orders, rewards, coin history and reviews: while your account is open, because they are
            your history in the app.
          </li>
          <li>
            Invoices and payment records: up to eight years after the transaction, as required by
            Indian tax and company law — these survive account deletion.
          </li>
          <li>Audit logs of administrative actions: up to three years.</li>
          <li>
            After you delete your account, we remove or anonymise the rest within 30 days, except
            where we must keep something to meet a legal obligation or defend a claim.
          </li>
        </UL>
      </Section>

      <Section heading="8. Your rights">
        <P>Under the Digital Personal Data Protection Act, 2023 you can ask us to:</P>
        <UL>
          <li>tell you what personal data we hold about you and who we have shared it with;</li>
          <li>correct or complete anything inaccurate;</li>
          <li>erase your data and close your account;</li>
          <li>
            withdraw consent you have given — for example for push notifications — without affecting
            what we did before you withdrew it;
          </li>
          <li>nominate someone to exercise these rights if you die or become incapacitated.</li>
        </UL>
        <P>
          Write to{' '}
          <a href={`mailto:${LEGAL.supportEmail}`} className="font-medium text-primary underline">
            {LEGAL.supportEmail}
          </a>{' '}
          from your registered email address. We respond within 30 days. If you are not satisfied,
          you may complain to the Data Protection Board of India.
        </P>
      </Section>

      <Section heading="9. Security">
        <P>
          Sign-in uses bearer tokens over HTTPS; PINs are stored hashed; a session ends the moment a
          token is revoked. Access to production data is limited to staff who need it, and
          administrative actions are logged. Payment credentials never reach our servers.
        </P>
        <P>
          No system is perfectly secure. If a breach is likely to affect you, we will notify you and
          the Data Protection Board as the law requires.
        </P>
      </Section>

      <Section heading="10. Children">
        <P>
          {LEGAL.brand} is not intended for children under 18. We do not knowingly collect their
          data. If you believe a child has an account, write to us and we will delete it.
        </P>
      </Section>

      <Section heading="11. Changes to this policy">
        <P>
          The date at the top of this page shows the current version. We will notify you in the app
          before a material change takes effect.
        </P>
      </Section>
    </LegalPage>
  )
}
