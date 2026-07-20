/**
 * Keyboard skip link — hidden until focused, then jumps to the main content.
 * Improves keyboard/screen-reader navigation (document/phase/03 §Accessibility).
 */
export function SkipToContent({ targetId = 'main-content' }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70]"
    >
      Skip to content
    </a>
  )
}
