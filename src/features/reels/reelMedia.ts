/**
 * Browser-side helpers for a reel upload. The server has no video transcoder,
 * so the duration check and the poster frame both happen here.
 */

export const MAX_VIDEO_MB = 25
export const MAX_VIDEO_SECONDS = 30

/** Duration and a JPEG poster frame (~0.5 s in) from a local video file. */
export function inspectVideo(file: File): Promise<{ duration: number; poster: Blob | null }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true
    video.src = url

    const done = (result: { duration: number; poster: Blob | null }) => {
      URL.revokeObjectURL(url)
      resolve(result)
    }

    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('This video could not be read. Try an MP4 file.'))
    }
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(0.5, (video.duration || 1) / 2)
    }
    video.onseeked = () => {
      const duration = Math.round(video.duration || 0)
      try {
        const canvas = document.createElement('canvas')
        const scale = Math.min(1, 720 / Math.max(video.videoWidth, 1))
        canvas.width = Math.round(video.videoWidth * scale)
        canvas.height = Math.round(video.videoHeight * scale)
        canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => done({ duration, poster: blob }), 'image/jpeg', 0.82)
      } catch {
        done({ duration, poster: null })
      }
    }
  })
}

/**
 * Only one reel plays at a time across the page: starting one pauses the last.
 * Saves data and battery, and keeps sound from overlapping.
 */
let current: HTMLVideoElement | null = null
export function playExclusive(video: HTMLVideoElement): void {
  if (current && current !== video) current.pause()
  current = video
  void video.play().catch(() => {
    // Autoplay refused (e.g. Low Power Mode) — the poster stays up.
  })
}
export function releaseVideo(video: HTMLVideoElement): void {
  video.pause()
  if (current === video) current = null
}

/** The visitor asked for less data (Data Saver / Lite mode). */
export function prefersSavingData(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  return connection?.saveData === true
}
