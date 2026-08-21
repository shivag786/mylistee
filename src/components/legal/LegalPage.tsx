import { useEffect, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/icons/Logo'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'
import { LEGAL } from '@/config/legal'

/**
 * Shell for the Terms / Privacy / Refund pages.
 *
 * These sit outside both the customer and owner shells: they must render for a
 * signed-out visitor with no bottom nav and no app chrome, because payment
 * providers and app stores open them cold as plain web pages.
 */
export function LegalPage({
  title,
  summary,
  children,
}: {
  title: string
  /** One-line plain-English gist, above the formal text. */
  summary: string
  children: ReactNode
}) {
  const navigate = useNavigate()

  // Arriving from a policy link mid-page would otherwise keep the old scroll.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [title])

  useEffect(() => {
    const previous = document.title
    document.title = `${title} · ${LEGAL.brand}`
    return () => {
      document.title = previous
    }
  }, [title])

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
        <div className="app-container flex h-16 items-center justify-between gap-3">
          <Link to={ROUTES.home} aria-label={`${LEGAL.brand} home`}>
            <Logo size={28} showWordmark />
          </Link>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="size-4" />}
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
        </div>
      </header>

      <main id="main-content" className="app-container flex-1 py-6">
        <article className="mx-auto max-w-2xl space-y-5">
          <header className="space-y-2">
            <h1 className="text-title font-bold text-foreground">{title}</h1>
            <p className="text-body text-text-secondary">{summary}</p>
            <p className="text-small text-text-muted">
              Last updated {LEGAL.lastUpdated} · {LEGAL.entity}
            </p>
          </header>

          {children}

          <footer className="space-y-3 border-t border-border pt-5">
            <p className="text-caption text-text-secondary">
              Questions about this page? Write to{' '}
              <a
                href={`mailto:${LEGAL.support.email}`}
                className="font-medium text-primary underline"
              >
                {LEGAL.support.email}
              </a>
              .
            </p>
            <nav
              aria-label="Other policies"
              className="flex flex-wrap gap-x-4 gap-y-1 text-caption"
            >
              <LegalLink to={ROUTES.terms} current={title}>
                Terms &amp; Conditions
              </LegalLink>
              <LegalLink to={ROUTES.privacy} current={title}>
                Privacy Policy
              </LegalLink>
              <LegalLink to={ROUTES.refund} current={title}>
                Refund &amp; Cancellation Policy
              </LegalLink>
            </nav>
          </footer>
        </article>
      </main>
    </div>
  )
}

/** Cross-link between the policies; the page you are on renders as plain text. */
function LegalLink({
  to,
  current,
  children,
}: {
  to: string
  current: string
  children: ReactNode
}) {
  const isCurrent = typeof children === 'string' && children === current

  return isCurrent ? (
    <span className="font-medium text-text-muted">{children}</span>
  ) : (
    <Link to={to} className="font-medium text-primary underline">
      {children}
    </Link>
  )
}

// ---------------------------------------------------------------- primitives
// Small typographic pieces so each policy file reads as content, not markup.

export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-body-lg font-semibold text-foreground">{heading}</h2>
      {children}
    </section>
  )
}

export function P({ children }: { children: ReactNode }) {
  return <p className="text-caption leading-relaxed text-text-secondary">{children}</p>
}

export function UL({ children }: { children: ReactNode }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5 text-caption leading-relaxed text-text-secondary">
      {children}
    </ul>
  )
}

/** A short, factual definition list — used for contact blocks and fee tables. */
export function DL({ items }: { items: Array<{ term: string; detail: ReactNode }> }) {
  return (
    <dl className="space-y-1.5 rounded-lg border border-border bg-surface-muted px-4 py-3">
      {items.map((item) => (
        <div key={item.term} className="flex flex-wrap gap-x-2 text-caption">
          <dt className="font-medium text-foreground">{item.term}:</dt>
          <dd className="text-text-secondary">{item.detail}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Emphasised callout for the one or two things a reader must not miss. */
export function Callout({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg bg-warning-soft px-4 py-3 text-caption leading-relaxed text-warning-foreground">
      {children}
    </p>
  )
}
