import { useState } from 'react'
import { cn } from '@/utils/cn'

interface ExpandableTextProps {
  text: string
  /** Character count after which the text is clipped and a "Read more" appears. */
  limit?: number
  className?: string
}

/**
 * Long text that clips after `limit` characters with a "Read more" / "See less"
 * toggle. Responsive (plain inline text) and accessible (`aria-expanded`).
 * Reused across product + combo cards (Phase 7.4+).
 */
export function ExpandableText({ text, limit = 120, className }: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false)
  const needsToggle = text.length > limit
  const shown = expanded || !needsToggle ? text : `${text.slice(0, limit).trimEnd()}… `

  return (
    <p className={cn('text-caption text-text-secondary', className)}>
      {shown}
      {needsToggle && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="font-medium text-primary hover:underline"
        >
          {expanded ? ' See less' : 'Read more'}
        </button>
      )}
    </p>
  )
}
