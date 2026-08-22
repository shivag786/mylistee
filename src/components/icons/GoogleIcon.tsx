import { cn } from '@/utils/cn'

interface GoogleIconProps {
  className?: string
}

/**
 * Google "G" mark, drawn in a single colour so it inherits the button's text
 * colour (white on the primary CTA). Google's brand guidelines allow this
 * mono/white treatment on coloured backgrounds where the full-colour mark
 * would not have enough contrast.
 */
export function GoogleIcon({ className }: GoogleIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      role="img"
      aria-hidden
      className={cn('size-5', className)}
    >
      <path d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.46a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81Z" />
      <path d="M12 24c3.24 0 5.96-1.08 7.94-2.92l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.09A12 12 0 0 0 12 24Z" />
      <path d="M5.29 14.28a7.2 7.2 0 0 1 0-4.56V6.63H1.28a12 12 0 0 0 0 10.74l4.01-3.09Z" />
      <path d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.63l4.01 3.09C6.23 6.88 8.88 4.77 12 4.77Z" />
    </svg>
  )
}
