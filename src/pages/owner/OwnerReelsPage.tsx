import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Clapperboard, Eye, EyeOff, ImagePlus, Images, Plus, Trash2, Video } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { SkeletonList } from '@/components/feedback/skeletons'
import { ConfirmationDialog } from '@/components/feedback/ConfirmationDialog'
import { useCreateReel, useDeleteReel, useMyReels, useSetReelVisible } from '@/features/reels/useReels'
import { MAX_VIDEO_MB, MAX_VIDEO_SECONDS, inspectVideo } from '@/features/reels/reelMedia'
import type { ShopReel } from '@/features/reels/reelService'
import { useProducts } from '@/features/owner/hooks/useProducts'
import { usePageTitle } from '@/hooks/usePageTitle'
import { toast } from '@/utils/toast'
import { ApiError } from '@/types/api'
import { MESSAGES } from '@/constants/messages'
import { cn } from '@/utils/cn'

/**
 * The shop's reels: short videos or a few photos played as a reel. They show
 * on the customer home page ("Reels near you"), ranked for followers and
 * people nearby.
 */
export function OwnerReelsPage() {
  usePageTitle('Reels')
  const reduce = useReducedMotion()
  const { data, isLoading, isError, refetch } = useMyReels()
  const setVisible = useSetReelVisible()
  const del = useDeleteReel()
  const [formOpen, setFormOpen] = useState(false)
  const [deleting, setDeleting] = useState<ShopReel | null>(null)

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-title font-bold text-foreground">Reels</h1>
          <p className="text-caption text-text-secondary">
            Short videos of your food. Customers nearby and your followers see them on the Listee home page.
          </p>
        </div>
        <Button size="sm" leftIcon={<Plus className="size-4" />} onClick={() => setFormOpen(true)}>
          New reel
        </Button>
      </header>

      {isLoading ? (
        <SkeletonList rows={3} />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={<Clapperboard className="size-7" />}
          title="No reels yet"
          description="Post a 10–30 second video of a dish being made or served — or a few photos. It's the fastest way to catch eyes on the home page."
          actionLabel="Post your first reel"
          onAction={() => setFormOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {data.map((reel, i) => (
            <motion.div
              key={reel.id}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 8) * 0.04 }}
            >
              <Card padding="none" className={cn('overflow-hidden', !reel.isVisible && 'opacity-60')}>
                <div className="relative aspect-[9/16] bg-secondary">
                  {reel.posterUrl ? (
                    <img src={reel.posterUrl} alt="" loading="lazy" className="size-full object-cover" />
                  ) : (
                    <span className="grid size-full place-items-center text-white/60">
                      <Video className="size-8" aria-hidden />
                    </span>
                  )}
                  <span className="absolute left-2 top-2 flex gap-1">
                    <Badge tone="neutral" className="gap-1 bg-black/45 text-white">
                      {reel.type === 'photos' ? <Images className="size-3" aria-hidden /> : <Video className="size-3" aria-hidden />}
                      {reel.type === 'photos' ? `${reel.photoUrls.length} photos` : reel.durationSeconds ? `${reel.durationSeconds}s` : 'Video'}
                    </Badge>
                    {!reel.isVisible && <Badge tone="neutral">Hidden</Badge>}
                  </span>
                  <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-small text-white">
                    <Eye className="size-3" aria-hidden /> {reel.views}
                  </span>
                </div>
                <div className="space-y-2 p-2.5">
                  {reel.caption && <p className="line-clamp-2 text-caption text-foreground">{reel.caption}</p>}
                  {reel.dish && <p className="truncate text-small text-text-secondary">Dish: {reel.dish.name}</p>}
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-1 px-2"
                      leftIcon={reel.isVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      onClick={() =>
                        setVisible.mutate(
                          { id: reel.id, visible: !reel.isVisible },
                          { onError: () => toast.error('Could not update this reel.') },
                        )
                      }
                    >
                      {reel.isVisible ? 'Hide' : 'Show'}
                    </Button>
                    <Button size="sm" variant="ghost" aria-label="Delete reel" onClick={() => setDeleting(reel)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <NewReelDialog open={formOpen} onOpenChange={setFormOpen} />

      <ConfirmationDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this reel?"
        description="It disappears from the home page and can't be brought back."
        confirmLabel="Delete"
        destructive
        isLoading={del.isPending}
        onConfirm={() => {
          if (!deleting) return
          del.mutate(deleting.id, {
            onSuccess: () => {
              toast.success('Reel deleted')
              setDeleting(null)
            },
            onError: (err) => toast.error(err instanceof ApiError ? err.message : MESSAGES.errors.generic),
          })
        }}
      />
    </div>
  )
}

function NewReelDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const create = useCreateReel()
  const products = useProducts()
  const [type, setType] = useState<'video' | 'photos'>('video')
  const [video, setVideo] = useState<{ file: File; url: string; poster: Blob | null; duration: number } | null>(null)
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([])
  const [caption, setCaption] = useState('')
  const [productId, setProductId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  // Fresh form each time, and free the preview URLs.
  useEffect(() => {
    if (open) return
    setVideo((v) => {
      if (v) URL.revokeObjectURL(v.url)
      return null
    })
    setPhotos((list) => {
      list.forEach((p) => URL.revokeObjectURL(p.url))
      return []
    })
    setCaption('')
    setProductId('')
    setError(null)
    setType('video')
  }, [open])

  async function pickVideo(file: File | undefined) {
    setError(null)
    if (!file) return
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      setError(`This video is ${(file.size / 1024 / 1024).toFixed(0)} MB. Keep it under ${MAX_VIDEO_MB} MB — trim it or record at 720p.`)
      return
    }
    setChecking(true)
    try {
      const { duration, poster } = await inspectVideo(file)
      if (duration > MAX_VIDEO_SECONDS) {
        setError(`This video is ${duration} seconds. Keep reels to ${MAX_VIDEO_SECONDS} seconds or less.`)
        return
      }
      setVideo((old) => {
        if (old) URL.revokeObjectURL(old.url)
        return { file, url: URL.createObjectURL(file), poster, duration }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'This video could not be read.')
    } finally {
      setChecking(false)
    }
  }

  function pickPhotos(files: FileList | null) {
    setError(null)
    if (!files) return
    const added = Array.from(files).filter((f) => f.type.startsWith('image/'))
    setPhotos((list) => [...list, ...added.map((file) => ({ file, url: URL.createObjectURL(file) }))].slice(0, 6))
  }

  const ready = type === 'video' ? video !== null : photos.length >= 2

  function submit() {
    if (!ready) return
    create.mutate(
      {
        type,
        video: video?.file,
        poster: video?.poster,
        durationSeconds: video?.duration || undefined,
        photos: type === 'photos' ? photos.map((p) => p.file) : undefined,
        caption: caption.trim() || undefined,
        productId: productId || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Reel posted')
          onOpenChange(false)
        },
        onError: (err) => {
          const first = err instanceof ApiError && err.errors ? Object.values(err.errors)[0]?.[0] : null
          setError(first ?? (err instanceof ApiError ? err.message : MESSAGES.errors.generic))
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New reel</DialogTitle>
          <DialogDescription>Vertical videos (9:16) in good light look best. Up to {MAX_VIDEO_SECONDS} seconds.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ['video', 'Video', Video],
                ['photos', '2–6 photos', Images],
              ] as const
            ).map(([key, label, Icon]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setType(key)
                  setError(null)
                }}
                aria-pressed={type === key}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-xl border p-3 text-caption font-semibold transition-colors',
                  type === key ? 'border-primary bg-primary-soft text-foreground' : 'border-border hover:bg-surface-muted',
                )}
              >
                <Icon className="size-4" aria-hidden /> {label}
              </button>
            ))}
          </div>

          {type === 'video' ? (
            video ? (
              <div className="space-y-2">
                <video src={video.url} controls muted playsInline className="mx-auto max-h-80 rounded-xl bg-black" />
                <p className="text-center text-small text-text-muted">
                  {video.duration}s · {(video.file.size / 1024 / 1024).toFixed(1)} MB ·{' '}
                  <button type="button" className="font-medium text-primary" onClick={() => setVideo(null)}>
                    Choose another
                  </button>
                </p>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-6 text-center hover:bg-surface-muted">
                <Video className="size-8 text-primary" aria-hidden />
                <span className="text-caption font-semibold text-foreground">{checking ? 'Checking video…' : 'Choose a video'}</span>
                <span className="text-small text-text-muted">MP4, up to {MAX_VIDEO_MB} MB</span>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  className="sr-only"
                  onChange={(e) => void pickVideo(e.target.files?.[0])}
                />
              </label>
            )
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                {photos.map((p, i) => (
                  <div key={p.url} className="relative aspect-[9/16] overflow-hidden rounded-lg">
                    <img src={p.url} alt="" className="size-full object-cover" />
                    <button
                      type="button"
                      onClick={() =>
                        setPhotos((list) => {
                          URL.revokeObjectURL(list[i].url)
                          return list.filter((_, j) => j !== i)
                        })
                      }
                      className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black/55 text-white"
                      aria-label="Remove photo"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                ))}
                {photos.length < 6 && (
                  <label className="grid aspect-[9/16] cursor-pointer place-items-center rounded-lg border-2 border-dashed border-border text-text-muted hover:bg-surface-muted">
                    <ImagePlus className="size-6" aria-hidden />
                    <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => pickPhotos(e.target.files)} />
                  </label>
                )}
              </div>
              <p className="text-small text-text-muted">{photos.length}/6 photos — they play one after another with a slow zoom.</p>
            </div>
          )}

          <label className="block space-y-1">
            <span className="text-caption font-medium text-foreground">Caption (optional)</span>
            <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={150} rows={2} placeholder="Fresh out of the oven 🔥" />
          </label>

          <label className="block space-y-1">
            <span className="text-caption font-medium text-foreground">Dish in this reel (optional)</span>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="h-11 w-full rounded-input border border-border bg-surface px-3 text-body text-foreground focus:border-primary focus:outline-none"
            >
              <option value="">None</option>
              {(products.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <span className="block text-small text-text-muted">Customers get an "Order" button for it right on the reel.</span>
          </label>

          {error && <p className="rounded-lg bg-destructive-soft px-3 py-2 text-small text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={create.isPending}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={!ready || checking} isLoading={create.isPending}>
              Post reel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
