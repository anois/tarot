export const ALLOWED_IMAGE_MIME = ['image/png', 'image/jpeg', 'image/webp'] as const

export function isAllowedImageMime(mime: string): boolean {
  return (ALLOWED_IMAGE_MIME as readonly string[]).includes(mime)
}

/** Whether a string is a base64 data URL of an allowed raster image type. */
export function isSafeImageDataUrl(value: string): boolean {
  return /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value)
}

export interface SanitizeOptions {
  /** Longest edge, in px, after downscale. */
  maxDimension?: number
  /** WebP quality 0..1. */
  quality?: number
  /** Reject files larger than this (bytes). */
  maxBytes?: number
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('读取文件失败'))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片解码失败'))
    img.src = src
  })
}

/**
 * Take a user-uploaded image file and return a safe, bounded data URL.
 * - allowlists PNG/JPEG/WebP (SVG and everything else rejected — SVG can carry script)
 * - caps file size and downscales to maxDimension
 * - RE-ENCODES through <canvas> to strip EXIF/metadata and any non-image payload
 */
export async function sanitizeImageToDataUrl(
  file: File,
  opts: SanitizeOptions = {},
): Promise<string> {
  const { maxDimension = 2048, quality = 0.85, maxBytes = 5 * 1024 * 1024 } = opts
  if (!isAllowedImageMime(file.type)) {
    throw new Error('不支持的图片格式（仅支持 PNG / JPEG / WebP）')
  }
  if (file.size > maxBytes) {
    throw new Error(`图片过大（上限 ${(maxBytes / 1024 / 1024).toFixed(1)} MB）`)
  }
  const sourceUrl = await readAsDataURL(file)
  const img = await loadImage(sourceUrl)
  const scale = Math.min(1, maxDimension / Math.max(img.width, img.height))
  const width = Math.max(1, Math.round(img.width * scale))
  const height = Math.max(1, Math.round(img.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建画布上下文')
  ctx.drawImage(img, 0, 0, width, height)
  return canvas.toDataURL('image/webp', quality)
}
