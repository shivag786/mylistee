import { cn } from '@/utils/cn'

interface DishPhotoProps {
  src: string
  className?: string
  /** Rounded corners of the photo (and its glow). */
  rounded?: string
  /** How strong the coloured glow under the dish is ('none' = plain photo). */
  glow?: 'none' | 'soft' | 'strong'
  eager?: boolean
}

/**
 * A dish photo at its upload shape (4:3) with a glow underneath in the dish's
 * own colours. The glow is a blurred copy of the same photo, so a red curry
 * glows warm and a salad glows green without reading pixels — which a canvas
 * couldn't do anyway for images served from another origin.
 */
export function DishPhoto({ src, className, rounded = 'rounded-2xl', glow = 'soft', eager }: DishPhotoProps) {
  return (
    <span className={cn('relative block', className)}>
      {glow !== 'none' && (
        <img
          src={src}
          alt=""
          aria-hidden
          loading={eager ? 'eager' : 'lazy'}
          className={cn(
            'pointer-events-none absolute inset-x-[8%] top-[18%] h-[90%] w-[84%] object-cover saturate-150',
            rounded,
            glow === 'strong' ? 'opacity-80 blur-2xl' : 'opacity-55 blur-xl',
          )}
        />
      )}
      <img
        src={src}
        alt=""
        loading={eager ? 'eager' : 'lazy'}
        className={cn('relative aspect-[4/3] w-full object-cover', rounded)}
      />
    </span>
  )
}
