import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * tailwind-merge only knows Tailwind's stock font sizes, so it read our token
 * sizes (`text-body`, `text-caption`, … from tokens.css) as text *colours* and
 * dropped the colour next to them — a primary Button lost its white text to
 * its own `text-body`. Registering the scale keeps size and colour apart.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['display', 'heading', 'title', 'subtitle', 'body-lg', 'body', 'caption', 'small'],
    },
  },
})

/**
 * Merge conditional class names and resolve Tailwind conflicts
 * (later class wins). Used by every reusable component.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
