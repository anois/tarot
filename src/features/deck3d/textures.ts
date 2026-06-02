import * as THREE from 'three'

export { cardImageUrl } from '@/deck/images'

let backTexture: THREE.Texture | null = null

/** Procedurally drawn card back — keeps the deck on-theme with no extra asset. */
export function getBackTexture(): THREE.Texture {
  if (backTexture) return backTexture
  const w = 512
  const h = 880
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  // deep indigo ground
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, '#1d1a3a')
  grad.addColorStop(1, '#0b0a1a')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  // gold double border
  ctx.strokeStyle = '#d9a441'
  ctx.lineWidth = 10
  ctx.strokeRect(22, 22, w - 44, h - 44)
  ctx.lineWidth = 3
  ctx.strokeRect(40, 40, w - 80, h - 80)

  // diamond lattice
  ctx.strokeStyle = 'rgba(217,164,65,0.25)'
  ctx.lineWidth = 1.5
  const step = 56
  for (let x = -h; x < w + h; x += step) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x + h, h)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x, h)
    ctx.lineTo(x + h, 0)
    ctx.stroke()
  }

  // central sun/star medallion
  const cx = w / 2
  const cy = h / 2
  ctx.save()
  ctx.translate(cx, cy)
  ctx.fillStyle = '#0b0a1a'
  ctx.beginPath()
  ctx.arc(0, 0, 120, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#e8c468'
  ctx.lineWidth = 4
  ctx.stroke()
  ctx.fillStyle = '#e8c468'
  const spikes = 8
  ctx.beginPath()
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? 92 : 38
    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2
    const px = Math.cos(a) * r
    const py = Math.sin(a) * r
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#1d1a3a'
  ctx.beginPath()
  ctx.arc(0, 0, 18, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  backTexture = tex
  return tex
}
