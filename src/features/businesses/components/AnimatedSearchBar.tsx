import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useReducedMotion } from 'framer-motion'
import { Search } from 'lucide-react'
import { ROUTES } from '@/constants/routes'

const WORDS = ['cafés nearby', 'salons & spas', "today's offers", 'trending shops', 'coins to earn']

/**
 * Search entry with a typewriter placeholder that cycles through what you can
 * find. Tapping opens the search page. Reduced-motion shows a static prompt.
 */
export function AnimatedSearchBar() {
  const reduce = useReducedMotion()
  const [text, setText] = useState('')
  const [wordIndex, setWordIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (reduce) return
    const word = WORDS[wordIndex]
    const atFullWord = !deleting && text === word
    const atEmpty = deleting && text === ''

    const delay = atFullWord ? 1500 : atEmpty ? 250 : deleting ? 45 : 85
    const timer = setTimeout(() => {
      if (atFullWord) {
        setDeleting(true)
      } else if (atEmpty) {
        setDeleting(false)
        setWordIndex((i) => (i + 1) % WORDS.length)
      } else {
        setText(deleting ? word.slice(0, text.length - 1) : word.slice(0, text.length + 1))
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [text, deleting, wordIndex, reduce])

  return (
    <Link
      to={ROUTES.search}
      aria-label="Search shops and offers"
      className="flex h-13 items-center gap-2 rounded-input border border-border bg-surface px-4 text-text-secondary shadow-soft transition-colors hover:border-primary/40"
    >
      <Search className="size-5 text-text-muted" aria-hidden />
      {reduce ? (
        <span className="text-body text-text-muted">Search shops, cafés, offers…</span>
      ) : (
        <span className="text-body">
          <span className="text-text-muted">Search </span>
          <span className="font-medium text-foreground">{text}</span>
          <span className="ml-0.5 inline-block w-px animate-pulse bg-foreground align-middle">&nbsp;</span>
        </span>
      )}
    </Link>
  )
}
