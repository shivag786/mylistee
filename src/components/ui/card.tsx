import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'

/**
 * Card — ShadCN-style surface, tokenized to Listee (radius 20 + soft shadow,
 * document-00A §15). Keeps our elevation/padding/interactive variants and adds
 * the ShadCN Card subcomponents (Header/Title/Description/Content/Footer).
 */
const cardVariants = cva('bg-card text-card-foreground rounded-card border border-border/60', {
  variants: {
    elevation: {
      flat: 'shadow-none',
      soft: 'shadow-soft',
      floating: 'shadow-floating',
    },
    padding: {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-5',
      lg: 'p-6',
    },
    interactive: {
      true: 'transition-transform duration-300 ease-out hover:-translate-y-0.5 hover:shadow-floating cursor-pointer',
      false: '',
    },
  },
  defaultVariants: { elevation: 'soft', padding: 'md', interactive: false },
})

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, elevation, padding, interactive, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      data-slot="card"
      className={cn(cardVariants({ elevation, padding, interactive }), className)}
      {...props}
    />
  )
})

function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1.5', className)} {...props} />
}

function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-subtitle font-semibold text-foreground', className)} {...props} />
}

function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-caption text-text-secondary', className)} {...props} />
}

function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('', className)} {...props} />
}

function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center', className)} {...props} />
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, cardVariants }
