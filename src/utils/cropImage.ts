import type { Area } from 'react-easy-crop'

/** Load an object-URL / data-URL into an HTMLImageElement. */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (err) => reject(err))
    image.src = url
  })
}

/** Cap the longest output edge so zoomed-out crops don't produce huge files. */
const MAX_DIMENSION = 1600

/**
 * Produce a cropped image File from a source and the pixel crop area returned by
 * react-easy-crop. Shared by every ImageCropField instance (Phase 7.0) so crop
 * output is identical across categories, products, and profiles.
 *
 * The crop area is expressed in the source image's natural-pixel space. When the
 * owner zooms out to keep the WHOLE image, that area can be larger than the image
 * and its origin can be negative — the uncovered padding is filled with
 * `background` so the whole photo is preserved instead of being clipped.
 */
export async function getCroppedImageFile(
  src: string,
  crop: Area,
  fileName = 'image.jpg',
  mimeType = 'image/jpeg',
  background = '#ffffff',
): Promise<File> {
  const image = await loadImage(src)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not process the image. Please try again.')

  const cropWidth = Math.max(1, Math.round(crop.width))
  const cropHeight = Math.max(1, Math.round(crop.height))
  const scale = Math.min(1, MAX_DIMENSION / Math.max(cropWidth, cropHeight))

  canvas.width = Math.max(1, Math.round(cropWidth * scale))
  canvas.height = Math.max(1, Math.round(cropHeight * scale))

  // Fill first: JPEG has no alpha, and this becomes the padding when the image
  // is zoomed out to fit fully inside the frame.
  ctx.fillStyle = background
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Draw the entire image, offset so the crop origin sits at (0,0). Both the
  // offset and the image are scaled uniformly to match the output canvas.
  ctx.drawImage(
    image,
    -crop.x * scale,
    -crop.y * scale,
    image.naturalWidth * scale,
    image.naturalHeight * scale,
  )

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mimeType, 0.9),
  )
  if (!blob) throw new Error('Could not process the image. Please try again.')

  return new File([blob], fileName, { type: mimeType })
}
