/** URL for a bundled card face image. Three-free so non-3D code can import it. */
export function cardImageUrl(imageKey: string): string {
  return `${import.meta.env.BASE_URL}deck/${imageKey}.jpg`
}
