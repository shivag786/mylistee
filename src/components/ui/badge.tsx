import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'

/** Badge — ShadCN-style, tokenized. Tones cover status + premium (phase/16). */
const badgeVariants = cva('inline-flex items-center gap-1 rounded-full font-medium leading-none', {
  variants: {
    tone: {
      primary: 'bg-primary-soft text-primary',
      secondary: 'bg-secondary-soft text-secondary',
      success: 'bg-success-soft text-success',
      warning: 'bg-warning-soft text-warning',
      danger: 'bg-destructive-soft text-destructive',
      info: 'bg-info-soft text-info',
      premium: 'bg-premium-soft text-premium-foreground',
      neutral: 'bg-surface-muted text-text-secondary',
    },
    size: {
      sm: 'px-2 py-0.5 text-small',
      md: 'px-2.5 py-1 text-caption',
    },
  },
  defaultVariants: { tone: 'neutral', size: 'sm' },
})

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, tone, size, ...props }: BadgeProps) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ tone, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
