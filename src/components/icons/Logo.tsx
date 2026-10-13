import { useSyncExternalStore } from 'react'
import { cn } from '@/utils/cn'
import { appIconUrl, getBrandIcon, subscribeBrandIcon } from '@/features/brandTheme/brandTheme'

interface LogoProps {
  /** Icon pixel size. */
  size?: number
  /** Show the wordmark next to the icon mark. */
  showWordmark?: boolean
  className?: string
}

/**
 * Listee brand mark. Simple, flat, rounded, monochrome-friendly and scalable
 * from 16px to 512px (document-00 §Logo Philosophy). A rounded pin + spark
 * suggesting "rewards around you" without referencing food/QR/spin.
 *
 * Drawn in the theme's primary and reward colours; when the admin has uploaded
 * an app icon instead, that image is shown.
 */
export function Logo({ size = 32, showWordmark = false, className }: LogoProps) {
  const icon = useSyncExternalStore(subscribeBrandIcon, getBrandIcon, getBrandIcon)
  const uploaded = icon.mode === 'upload' && icon.version

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      {uploaded ? (
        <img
          src={`${appIconUrl(size > 64 ? 'icon-192' : 'icon-64')}?v=${icon.version}`}
          width={size}
          height={size}
          alt="Listee"
          className="rounded-[29%] object-cover"
        />
      ) : (
        <svg
          width={size}
          height={size}
          viewBox="0 0 48 48"
          fill="none"
          role="img"
          aria-label="Listee"
        >
          <rect width="48" height="48" rx="14" fill="var(--primary)" />
          <path
            d="M24 11c-5.5 0-10 4.3-10 9.7 0 6.9 8.4 14.4 9.3 15.2a1 1 0 0 0 1.4 0c.9-.8 9.3-8.3 9.3-15.2C34 15.3 29.5 11 24 11Z"
            fill="#ffffff"
          />
          <path
            d="m24 16.4 1.9 3.9 4.3.6-3.1 3 .7 4.3-3.8-2-3.8 2 .7-4.3-3.1-3 4.3-.6L24 16.4Z"
            fill="var(--gold)"
          />
        </svg>
      )}
      {showWordmark && (
        <span className="text-title font-semibold tracking-tight text-foreground">Listee</span>
      )}
    </span>
  )
}
