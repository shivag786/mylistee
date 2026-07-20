import type { HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

/**
 * Skeleton placeholder using the shimmer utility. Prefer skeletons over blank
 * screens or spinners for content areas (document/phase/06 §Loading).
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('skeleton rounded-md', className)} {...props} />
}
