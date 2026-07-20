import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'

/** Icon-only button. `aria-label` is required for accessibility. */
const iconButtonVariants = cva(
  [
    'inline-flex items-center justify-center rounded-full outline-none',
    'transition-[transform,background-color,color] duration-150 ease-out active:scale-90',
    'focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        ghost: 'bg-transparent text-text-secondary hover:bg-surface-muted hover:text-foreground',
        subtle: 'bg-surface-muted text-foreground hover:bg-border',
        solid: 'bg-primary text-primary-foreground shadow-soft hover:bg-primary-hover',
        outline: 'border border-border-strong text-foreground hover:bg-surface-muted',
      },
      size: {
        sm: 'size-9 [&_svg]:size-4',
        md: 'size-11 [&_svg]:size-5',
        lg: 'size-12 [&_svg]:size-6',
      },
    },
    defaultVariants: { variant: 'ghost', size: 'md' },
  },
)

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  'aria-label': string
  asChild?: boolean
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { className, variant, size, asChild = false, ...props },
  ref,
) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      ref={ref}
      className={cn(iconButtonVariants({ variant, size }), className)}
      {...props}
    />
  )
})

export { IconButton, iconButtonVariants }
