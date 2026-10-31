export const MAX_PHOTO_DIMENSION = 2000
export const PHOTO_QUALITY = 0.85

/**
 * Shrinks a camera photo so tab sheets stay sharp but don't fill up the phone.
 * If the browser can't decode the file (for example HEIC on some desktops),
 * the original file is kept as-is rather than losing the photo.
 */
export async function compressImage(file: Blob, maxDimension: number = MAX_PHOTO_DIMENSION): Promise<Blob> {
  if (typeof createImageBitmap !== 'function') return file

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    return file
  }

  try {
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const context = canvas.getContext('2d')
    if (!context) return file

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const compressed = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', PHOTO_QUALITY))
    return compressed && compressed.size < file.size ? compressed : file
  } finally {
    bitmap.close()
  }
}
