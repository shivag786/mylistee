import * as React from 'react'
import { cn } from '@/utils/cn'

/** Input — ShadCN primitive, tokenized (height 52, radius 12; document-00A §14). */
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, type = 'text', ...props }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        className={cn(
          'flex h-13 w-full rounded-input border border-border bg-surface px-4 text-body text-foreground',
          'outline-none transition-colors placeholder:text-text-muted',
          'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20',
          'disabled:cursor-not-allowed disabled:opacity-60',
          'aria-[invalid=true]:border-destructive',
          className,
        )}
        {...props}
      />
    )
  },
)

export { Input }
