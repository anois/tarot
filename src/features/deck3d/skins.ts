import * as THREE from 'three'
import type { Card } from '@/deck/types'

// ── Style registries (ids + display names for the picker) ─────────────────
export type BackStyleId = 'arcane-gold' | 'midnight' | 'art-deco' | 'rose'
export type ClothStyleId = 'felt-emerald' | 'velvet-indigo' | 'walnut' | 'obsidian'
export type FaceStyleId = 'classic' | 'minimal'

export const BACK_STYLES: { id: BackStyleId; name: string }[] = [
  { id: 'arcane-gold', name: '秘金' },
  { id: 'midnight', name: '子夜星月' },
  { id: 'art-deco', name: '装饰艺术' },
  { id: 'rose', name: '玫瑰窗' },
]
export const CLOTH_STYLES: { id: ClothStyleId; name: string }[] = [
  { id: 'felt-emerald', name: '祖母绿绒' },
  { id: 'velvet-indigo', name: '靛蓝丝绒' },
  { id: 'walnut', name: '胡桃木' },
  { id: 'obsidian', name: '黑曜石' },
]
export const FACE_STYLES: { id: FaceStyleId; name: string }[] = [
  { id: 'classic', name: '经典韦特' },
  { id: 'minimal', name: '极简墨金' },
]

// ── helpers ───────────────────────────────────────────────────────────────
function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!]
}
function texture(c: HTMLCanvasElement, repeat = 1): THREE.Texture {
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  if (repeat !== 1) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(repeat, repeat)
  }
  return t
}
function roundedFrame(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(6, w * 0.02)
  ctx.strokeRect(w * 0.045, h * 0.03, w * 0.91, h * 0.94)
  ctx.lineWidth = Math.max(2, w * 0.006)
  ctx.strokeRect(w * 0.075, h * 0.05, w * 0.85, h * 0.9)
}
function star(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outer: number, inner: number) {
  ctx.beginPath()
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2
    const x = cx + Math.cos(a) * r
    const y = cy + Math.sin(a) * r
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
}

// ── Card backs ──────────────────────────────────────────────────────────
const backCache = new Map<BackStyleId, THREE.Texture>()

export function getBackTexture(id: BackStyleId): THREE.Texture {
  const cached = backCache.get(id)
  if (cached) return cached
  const W = 512
  const H = 896
  const [c, ctx] = canvas(W, H)

  if (id === 'arcane-gold') {
    const g = ctx.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, '#1d1a3a')
    g.addColorStop(1, '#0b0a1a')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = 'rgba(217,164,65,0.22)'
    ctx.lineWidth = 1.5
    const step = 52
    for (let x = -H; x < W + H; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + H, H); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(x, H); ctx.lineTo(x + H, 0); ctx.stroke()
    }
    roundedFrame(ctx, W, H, '#d9a441')
    ctx.save()
    ctx.translate(W / 2, H / 2)
    ctx.fillStyle = '#0b0a1a'
    ctx.beginPath(); ctx.arc(0, 0, 120, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#e8c468'; ctx.lineWidth = 4; ctx.stroke()
    ctx.fillStyle = '#e8c468'; star(ctx, 0, 0, 8, 92, 38); ctx.fill()
    ctx.fillStyle = '#1d1a3a'; ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill()
    ctx.restore()
  } else if (id === 'midnight') {
    const g = ctx.createRadialGradient(W / 2, H * 0.42, 40, W / 2, H * 0.42, H * 0.7)
    g.addColorStop(0, '#15203f')
    g.addColorStop(1, '#070612')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
    // scattered stars (deterministic)
    let seed = 7
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
    for (let i = 0; i < 120; i++) {
      const x = rnd() * W, y = rnd() * H, r = rnd() * 1.8 + 0.4
      ctx.fillStyle = `rgba(232,196,104,${0.3 + rnd() * 0.6})`
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
    }
    // crescent moon
    ctx.save(); ctx.translate(W / 2, H * 0.42)
    ctx.fillStyle = '#f3dca0'; ctx.beginPath(); ctx.arc(0, 0, 70, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = 'rgba(7,6,18,1)'; ctx.beginPath(); ctx.arc(28, -10, 64, 0, Math.PI * 2); ctx.fill()
    ctx.restore()
    roundedFrame(ctx, W, H, '#c9b06a')
  } else if (id === 'art-deco') {
    ctx.fillStyle = '#0a0a0d'; ctx.fillRect(0, 0, W, H)
    ctx.save(); ctx.translate(W / 2, H / 2)
    ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 3
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * H, Math.sin(a) * H); ctx.stroke()
    }
    ctx.fillStyle = '#0a0a0d'; ctx.beginPath(); ctx.arc(0, 0, 150, 0, Math.PI * 2); ctx.fill()
    for (let r = 150; r > 30; r -= 26) {
      ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 2.5
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke()
    }
    ctx.fillStyle = '#d4af37'; star(ctx, 0, 0, 4, 60, 14); ctx.fill()
    ctx.restore()
    roundedFrame(ctx, W, H, '#d4af37')
  } else {
    // rose window
    const g = ctx.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, '#3a0d16'); g.addColorStop(1, '#15060a')
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
    ctx.save(); ctx.translate(W / 2, H / 2)
    ctx.strokeStyle = 'rgba(232,196,104,0.85)'
    for (let ring = 0; ring < 4; ring++) {
      const r = 60 + ring * 50
      ctx.lineWidth = 2.5
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke()
      const petals = 8 + ring * 4
      for (let i = 0; i < petals; i++) {
        const a = (i / petals) * Math.PI * 2
        ctx.beginPath(); ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 16 - ring * 2, 0, Math.PI * 2); ctx.stroke()
      }
    }
    ctx.fillStyle = '#e8c468'; ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.fill()
    ctx.restore()
    roundedFrame(ctx, W, H, '#e8c468')
  }

  const t = texture(c)
  backCache.set(id, t)
  return t
}

// ── Tablecloth textures ───────────────────────────────────────────────────
const clothCache = new Map<ClothStyleId, THREE.Texture>()

export function getClothTexture(id: ClothStyleId): THREE.Texture {
  const cached = clothCache.get(id)
  if (cached) return cached
  const S = 1024
  const [c, ctx] = canvas(S, S)

  const base: Record<ClothStyleId, [string, string]> = {
    'felt-emerald': ['#0d3b2e', '#06231a'],
    'velvet-indigo': ['#241b52', '#0d0a26'],
    walnut: ['#4a2f1c', '#2a1a0f'],
    obsidian: ['#16161f', '#070710'],
  }
  const [c1, c2] = base[id]
  const g = ctx.createRadialGradient(S / 2, S / 2, 60, S / 2, S / 2, S * 0.72)
  g.addColorStop(0, c1)
  g.addColorStop(1, c2)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, S, S)

  let seed = 99
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)

  if (id === 'walnut') {
    for (let i = 0; i < 60; i++) {
      ctx.strokeStyle = `rgba(0,0,0,${0.04 + rnd() * 0.06})`
      ctx.lineWidth = 1 + rnd() * 2
      const y = rnd() * S
      ctx.beginPath(); ctx.moveTo(0, y)
      for (let x = 0; x <= S; x += 32) ctx.lineTo(x, y + Math.sin(x * 0.02 + i) * 6)
      ctx.stroke()
    }
  } else if (id === 'velvet-indigo') {
    for (let i = 0; i < 90; i++) {
      const x = rnd() * S, y = rnd() * S, r = rnd() * 1.5 + 0.3
      ctx.fillStyle = `rgba(195,184,255,${0.15 + rnd() * 0.35})`
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
    }
  }
  // fabric noise for everything (subtle)
  ctx.globalAlpha = 0.05
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = rnd() > 0.5 ? '#ffffff' : '#000000'
    ctx.fillRect(rnd() * S, rnd() * S, 1, 1)
  }
  ctx.globalAlpha = 1

  const t = texture(c)
  clothCache.set(id, t)
  return t
}

// ── Minimalist (procedural) card face ──────────────────────────────────────
const SUIT_TINT: Record<string, [string, string, string]> = {
  wands: ['#3a1407', '#7a2e10', '#f0a84e'],
  cups: ['#0a1f3a', '#123a63', '#6fb6ff'],
  swords: ['#0c1622', '#22405a', '#9fd6ff'],
  pentacles: ['#0d2415', '#1d4a2c', '#7fe0a0'],
  major: ['#1a1140', '#2e2070', '#c3b8ff'],
}
const RANK_GLYPH: Record<string, string> = {
  '01': 'A', page: '侍', knight: '骑', queen: '后', king: '王',
}
const ROMAN = [
  '0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI',
]
const SUIT_LABEL: Record<string, string> = { wands: '权杖', cups: '圣杯', swords: '宝剑', pentacles: '星币' }

function drawSuitIcon(ctx: CanvasRenderingContext2D, suit: string, cx: number, cy: number, s: number, color: string) {
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = s * 0.08
  ctx.beginPath()
  if (suit === 'cups') {
    ctx.arc(cx, cy - s * 0.1, s * 0.5, 0, Math.PI)
    ctx.moveTo(cx, cy + s * 0.4); ctx.lineTo(cx, cy + s * 0.7)
    ctx.moveTo(cx - s * 0.35, cy + s * 0.7); ctx.lineTo(cx + s * 0.35, cy + s * 0.7)
    ctx.stroke()
  } else if (suit === 'swords') {
    ctx.moveTo(cx, cy - s * 0.6); ctx.lineTo(cx, cy + s * 0.6)
    ctx.moveTo(cx - s * 0.35, cy + s * 0.3); ctx.lineTo(cx + s * 0.35, cy + s * 0.3)
    ctx.stroke()
  } else if (suit === 'wands') {
    ctx.moveTo(cx, cy + s * 0.6); ctx.lineTo(cx, cy - s * 0.4)
    ctx.stroke()
    star(ctx, cx, cy - s * 0.5, 5, s * 0.22, s * 0.09); ctx.fill()
  } else {
    // pentacles: pentagram in circle
    ctx.arc(cx, cy, s * 0.55, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath()
    for (let i = 0; i < 5; i++) {
      const a = (i * 4 * Math.PI) / 5 - Math.PI / 2
      const x = cx + Math.cos(a) * s * 0.42, y = cy + Math.sin(a) * s * 0.42
      if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
    }
    ctx.closePath(); ctx.stroke()
  }
}

const minimalCache = new Map<string, THREE.Texture>()

export function getMinimalFaceTexture(card: Card): THREE.Texture {
  const cached = minimalCache.get(card.id)
  if (cached) return cached
  const W = 512
  const H = 896
  const [c, ctx] = canvas(W, H)
  const suitKey = card.arcana === 'major' ? 'major' : card.suit!
  const [bg1, bg2, accent] = SUIT_TINT[suitKey]

  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, bg2); g.addColorStop(0.5, bg1); g.addColorStop(1, bg2)
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
  roundedFrame(ctx, W, H, accent)

  ctx.textAlign = 'center'
  // top caption
  ctx.fillStyle = accent
  ctx.font = '600 38px "Noto Serif SC", serif'
  ctx.fillText(card.arcana === 'major' ? '大阿卡纳' : SUIT_LABEL[card.suit!], W / 2, 110)

  // center glyph
  ctx.fillStyle = accent
  if (card.arcana === 'major') {
    ctx.font = '700 200px "Cinzel", serif'
    ctx.fillText(ROMAN[card.majorNumber ?? 0], W / 2, H / 2 + 40)
    drawSuitIcon(ctx, 'wands', W / 2, H * 0.72, 70, accent) // a star motif
  } else {
    const rank = card.rank!
    const glyph = RANK_GLYPH[rank] ?? String(Number(rank))
    ctx.font = '700 170px "Cinzel", serif'
    ctx.fillText(glyph, W / 2, H * 0.46)
    drawSuitIcon(ctx, card.suit!, W / 2, H * 0.66, 96, accent)
  }

  // bottom name
  ctx.fillStyle = '#f3dca0'
  ctx.font = '600 52px "Noto Serif SC", serif'
  ctx.fillText(card.nameZh, W / 2, H - 70)

  const t = texture(c)
  minimalCache.set(card.id, t)
  return t
}
