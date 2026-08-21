import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { LEGAL } from '@/config/legal'
import { cn } from '@/utils/cn'

/**
 * Policy links, shown at the bottom of every shell.
 *
 * The policy routes are public, but until now the only link to them lived on the
 * customer Profile page — behind sign-in. Putting them in a footer means nobody
 * has to log in to read the terms they are agreeing to, which is also what
 * payment providers and app stores expect to find.
 *
 * Sits in normal flow: both bottom navs are `sticky`, not `fixed`, so this needs
 * no spacer to avoid being covered.
 */
export function LegalFooter({ className }: { className?: string }) {
  return (
    <footer
      className={cn('border-t border-border/60 bg-surface/50 px-4 py-4', className)}
      aria-label="Legal"
    >
      <nav className="app-container flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-small">
        <Link to={ROUTES.terms} className="text-text-muted hover:text-foreground hover:underline">
          Terms &amp; Conditions
        </Link>
        <Link to={ROUTES.privacy} className="text-text-muted hover:text-foreground hover:underline">
          Privacy Policy
        </Link>
        <Link to={ROUTES.refund} className="text-text-muted hover:text-foreground hover:underline">
          Refund Policy
        </Link>
        <span className="text-text-disabled">
          © {new Date().getFullYear()} {LEGAL.brand}
        </span>
      </nav>
    </footer>
  )
}
