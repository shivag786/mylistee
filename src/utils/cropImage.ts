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

/**
 * Produce a cropped image File from a source and the pixel crop area returned by
 * react-easy-crop. Shared by every ImageCropField instance (Phase 7.0) so crop
 * output is identical across categories, products, and profiles.
 */
export async function getCroppedImageFile(
  src: string,
  crop: Area,
  fileName = 'image.jpg',
  mimeType = 'image/jpeg',
): Promise<File> {
  const image = await loadImage(src)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not process the image. Please try again.')

  canvas.width = Math.round(crop.width)
  canvas.height = Math.round(crop.height)

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  )

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mimeType, 0.9),
  )
  if (!blob) throw new Error('Could not process the image. Please try again.')

  return new File([blob], fileName, { type: mimeType })
}
