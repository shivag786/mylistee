import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { Loader2 } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'

/**
 * Button — ShadCN UI primitive adapted to the Listee design tokens.
 * The single button for the whole app (document/phase/04, phase/16). Extends
 * the ShadCN base with brand variants, token sizes, loading + icon props.
 * Radius/heights come from design tokens (document-00A §12–13, phase/16).
 */
const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap select-none',
    'rounded-button font-semibold outline-none',
    'transition-[transform,background-color,box-shadow,color] duration-150 ease-out',
    'active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1',
    'disabled:pointer-events-none disabled:bg-surface-muted disabled:text-text-disabled disabled:shadow-none',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground shadow-soft hover:bg-primary-hover',
        secondary: 'bg-secondary text-secondary-foreground shadow-soft hover:bg-secondary-hover',
        outline:
          'border border-border-strong bg-transparent text-foreground hover:bg-surface-muted',
        ghost: 'bg-transparent text-foreground hover:bg-surface-muted',
        success: 'bg-success text-success-foreground shadow-soft hover:brightness-95',
        danger: 'bg-destructive text-destructive-foreground shadow-soft hover:brightness-95',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-4 text-caption', // 36px
        md: 'h-11 px-5 text-body', // 44px
        lg: 'h-13 px-6 text-body', // 52px — primary CTA
        hero: 'h-15 px-8 text-body-lg', // 60px
        icon: 'size-11',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'lg',
      fullWidth: false,
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant,
    size,
    fullWidth,
    asChild = false,
    isLoading,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props
  },
  ref,
) {
  const classes = cn(buttonVariants({ variant, size, fullWidth }), className)

  // Slot (asChild) requires a single child — skip loader/icon injection.
  if (asChild) {
    return (
      <Slot ref={ref} className={classes} {...props}>
        {children}
      </Slot>
    )
  }

  return (
    <button
      ref={ref}
      className={classes}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="size-5 animate-spin" aria-hidden /> : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  )
})

export { Button, buttonVariants }
