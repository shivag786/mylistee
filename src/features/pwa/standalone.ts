/**
 * Whether the page is running as an installed app rather than a browser tab.
 *
 * Two checks, because iOS Safari never implemented the standard one: it reports
 * an installed web app through a non-standard `navigator.standalone` instead.
 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}
