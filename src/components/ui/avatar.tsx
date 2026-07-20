import * as React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { cn } from '@/utils/cn'
import { initials } from '@/utils/format'

/**
 * Avatar — ShadCN/Radix primitives (AvatarRoot/Image/Fallback) plus a Listee
 * convenience `Avatar` that renders an image with an initials fallback.
 * Token sizes: sm 32, md 40, lg 56, hero 96 (document-00A §20).
 */
const AvatarRoot = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(function AvatarRoot({ className, ...props }, ref) {
  return (
    <AvatarPrimitive.Root
      ref={ref}
      data-slot="avatar"
      className={cn('relative flex shrink-0 overflow-hidden rounded-full', className)}
      {...props}
    />
  )
})

const AvatarImage = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(function AvatarImage({ className, ...props }, ref) {
  return (
    <AvatarPrimitive.Image
      ref={ref}
      className={cn('size-full object-cover', className)}
      {...props}
    />
  )
})

const AvatarFallback = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(function AvatarFallback({ className, ...props }, ref) {
  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        'flex size-full items-center justify-center bg-primary-soft font-semibold text-primary',
        className,
      )}
      {...props}
    />
  )
})

const sizeMap = {
  sm: 'size-8 text-small',
  md: 'size-10 text-caption',
  lg: 'size-14 text-body',
  hero: 'size-24 text-title',
} as const

interface AvatarProps {
  name: string
  src?: string | null
  size?: keyof typeof sizeMap
  className?: string
}

function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  return (
    <AvatarRoot className={cn(sizeMap[size], className)}>
      {src && <AvatarImage src={src} alt={name} />}
      <AvatarFallback aria-label={name}>{initials(name)}</AvatarFallback>
    </AvatarRoot>
  )
}

export { Avatar, AvatarRoot, AvatarImage, AvatarFallback }
