import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge conditional class names and resolve Tailwind conflicts
 * (later class wins). Used by every reusable component.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
