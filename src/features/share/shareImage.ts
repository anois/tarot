import type { Spread } from '@/spreads/types'
import type { DrawnCard } from '@/mechanics/types'
import type { ReadingTurn } from '@/reading/types'
import { getCard } from '@/deck/cards'
import { cardImageUrl } from '@/deck/images'

export type ShareStyle = 'spread' | 'full'

export const GITHUB_URL = 'https://github.com/anois/tarot'

// candlelit palette (mirrors the @theme tokens)
const C = {
  bg0: '#0e0a13',
  bg1: '#17111d',
  panel: 'rgba(33,24,41,0.72)',
  gold: '#dcab44',
  goldHi: '#ecc66a',
  goldDim: '#c9952f',
  ink: '#f3ead6',
  ink2: '#cbbd9e',
  ink3: '#857c66',
  reversed: '#e2786f',
  upright: '#6fcf97',
  parchment: '#f3ead6',
  inkDark: '#1a1320',
}

const W = 1080
const PAD = 64
const FONT_SERIF = "'Cinzel','Songti SC','STSong',serif"
const FONT_SANS =
  "-apple-system,'PingFang SC','Microsoft YaHei','Noto Sans SC',system-ui,sans-serif"

interface ComposeArgs {
  spread: Spread
  drawn: DrawnCard[]
  question: string
  turns: ReadingTurn[]
  style: ShareStyle
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** Word/character wrap that breaks anywhere for CJK and on spaces for Latin. */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  for (const para of text.split('\n')) {
    if (para === '') {
      lines.push('')
      continue
    }
    let line = ''
    for (const ch of para) {
      const test = line + ch
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line)
        line = ch
      } else {
        line = test
      }
    }
    if (line) lines.push(line)
  }
  return lines
}

/** Strip the markdown that the LLM emits down to readable plain text. */
function toPlain(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '· ')
    .replace(/^\s*>\s?/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function makeQr(text: string): Promise<HTMLImageElement> {
  const mod = await import('qrcode')
  const QRCode = mod.default ?? mod
  const url = await QRCode.toDataURL(text, {
    margin: 1,
    width: 360,
    errorCorrectionLevel: 'M',
    color: { dark: C.inkDark, light: C.parchment },
  })
  return loadImage(url)
}

/** A centered row of gold-outline value-prop pills. */
function drawPills(ctx: CanvasRenderingContext2D, centerX: number, y: number, items: string[]) {
  const padX = 22
  const gap = 16
  const h = 48
  ctx.font = `500 27px ${FONT_SANS}`
  const widths = items.map((t) => ctx.measureText(t).width + padX * 2)
  const total = widths.reduce((a, b) => a + b, 0) + gap * (items.length - 1)
  let x = centerX - total / 2
  items.forEach((t, i) => {
    const w = widths[i]
    roundRect(ctx, x, y, w, h, h / 2)
    ctx.fillStyle = 'rgba(220,171,68,0.12)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(236,198,106,0.65)'
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.fillStyle = '#ecc66a'
    ctx.textAlign = 'center'
    ctx.font = `500 27px ${FONT_SANS}`
    ctx.fillText(t, x + w / 2, y + h / 2 + 9)
    x += w + gap
  })
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/**
 * Compose a shareable PNG of the reading. `style: 'spread'` shows just the
 * board; `'full'` appends the interpretation text. A QR to the GitHub homepage
 * sits in the footer. Returns a data URL.
 */
export async function composeShareImage({
  spread,
  drawn,
  question,
  turns,
  style,
}: ComposeArgs): Promise<string> {
  // Resolve fonts so canvas can use Cinzel / serif (no fallback flash).
  if (document.fonts?.ready) await document.fonts.ready

  const posById = new Map(spread.positions.map((p) => [p.id, p]))
  // draw order = paint order (z), then index, so crossing cards land on top
  const ordered = [...drawn].sort((a, b) => {
    const pa = posById.get(a.positionId)
    const pb = posById.get(b.positionId)
    return (pa?.z ?? 0) - (pb?.z ?? 0) || a.index - b.index
  })

  const cards = await Promise.all(
    ordered.map(async (d) => {
      const card = getCard(d.cardId)
      const pos = posById.get(d.positionId)
      const img = card ? await loadImage(cardImageUrl(card.imageKey)) : null
      return { d, card, pos, img }
    }),
  )
  const qr = await makeQr(GITHUB_URL)

  // ── board geometry (fit the normalized layout, capped height) ──
  const ar = spread.aspectRatio ?? 1
  const maxBoardW = W - PAD * 2
  const maxBoardH = 1180
  let boardW = maxBoardW
  let boardH = boardW / ar
  if (boardH > maxBoardH) {
    boardH = maxBoardH
    boardW = boardH * ar
  }
  const boardX = (W - boardW) / 2
  const showLabels = spread.cardCount <= 7

  // ── measure the optional interpretation block to size the canvas ──
  const measure = document.createElement('canvas').getContext('2d')!
  let interpLines: string[] = []
  const bodyPx = 30
  const lineH = 46
  if (style === 'full') {
    const text = turns
      .filter((t) => t.role === 'reading')
      .map((t) => toPlain(t.content))
      .join('\n\n')
    if (text) {
      measure.font = `400 ${bodyPx}px ${FONT_SANS}`
      const all = wrapText(measure, text, maxBoardW)
      const MAX_LINES = 30
      interpLines = all.slice(0, MAX_LINES)
      if (all.length > MAX_LINES) interpLines.push('……（完整解读见应用内）')
    }
  }

  // ── vertical layout cursor → total height ──
  const headerH = question.trim() ? 250 : 200
  const boardTop = headerH
  let cursorY = boardTop + boardH + 40
  let interpTop = 0
  if (interpLines.length) {
    interpTop = cursorY
    cursorY += 64 + interpLines.length * lineH + 40 // heading + lines + gap
  }
  const footerH = 320
  const H = Math.round(cursorY + footerH)

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // ── background + frame ──
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, C.bg1)
  grad.addColorStop(0.5, C.bg0)
  grad.addColorStop(1, C.bg1)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)
  // vignette
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, H * 0.75)
  vg.addColorStop(0, 'rgba(0,0,0,0)')
  vg.addColorStop(1, 'rgba(0,0,0,0.5)')
  ctx.fillStyle = vg
  ctx.fillRect(0, 0, W, H)
  // gold frame
  ctx.strokeStyle = 'rgba(220,171,68,0.45)'
  ctx.lineWidth = 2
  roundRect(ctx, 24, 24, W - 48, H - 48, 28)
  ctx.stroke()

  // ── header ──
  ctx.textAlign = 'center'
  ctx.fillStyle = C.goldHi
  ctx.font = `600 56px ${FONT_SERIF}`
  ctx.fillText('塔罗 · 3D 占卜', W / 2, 96)
  ctx.fillStyle = C.ink2
  ctx.font = `500 34px ${FONT_SANS}`
  ctx.fillText(spread.name, W / 2, 148)
  if (question.trim()) {
    ctx.fillStyle = C.ink3
    ctx.font = `400 28px ${FONT_SANS}`
    const q = wrapText(ctx, `「${question.trim()}」`, maxBoardW)[0]
    ctx.fillText(q, W / 2, 196)
  }

  // ── board ──
  for (const { d, card, pos, img } of cards) {
    if (!pos || !card) continue
    const cw = spread.card.widthRatio * boardW
    const imgAr = img && img.naturalWidth ? img.naturalWidth / img.naturalHeight : 0.585
    const ch = cw / imgAr
    const cx = boardX + pos.x * boardW
    const cy = boardTop + pos.y * boardH
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate((pos.rotation * Math.PI) / 180 + (d.reversed ? Math.PI : 0))
    // card shadow
    ctx.shadowColor = 'rgba(0,0,0,0.55)'
    ctx.shadowBlur = 22
    ctx.shadowOffsetY = 10
    roundRect(ctx, -cw / 2, -ch / 2, cw, ch, 10)
    ctx.fillStyle = '#000'
    ctx.fill()
    ctx.shadowColor = 'transparent'
    // card art (clipped to rounded rect)
    ctx.save()
    roundRect(ctx, -cw / 2, -ch / 2, cw, ch, 10)
    ctx.clip()
    if (img) ctx.drawImage(img, -cw / 2, -ch / 2, cw, ch)
    else {
      ctx.fillStyle = C.bg1
      ctx.fillRect(-cw / 2, -ch / 2, cw, ch)
    }
    ctx.restore()
    // gold edge
    ctx.strokeStyle = 'rgba(220,171,68,0.6)'
    ctx.lineWidth = 2
    roundRect(ctx, -cw / 2, -ch / 2, cw, ch, 10)
    ctx.stroke()
    ctx.restore()

    if (showLabels) {
      ctx.save()
      ctx.textAlign = 'center'
      ctx.fillStyle = C.ink2
      ctx.font = `500 22px ${FONT_SANS}`
      const labelY = cy + ch / 2 + 30
      ctx.fillText(pos.label, cx, Math.min(labelY, boardTop + boardH + 10))
      ctx.fillStyle = d.reversed ? C.reversed : C.upright
      ctx.font = `500 19px ${FONT_SANS}`
      ctx.fillText(
        `${card.nameZh} · ${d.reversed ? '逆位' : '正位'}`,
        cx,
        Math.min(labelY + 26, boardTop + boardH + 34),
      )
      ctx.restore()
    }
  }

  // ── interpretation ──
  if (interpLines.length) {
    ctx.textAlign = 'left'
    ctx.fillStyle = C.gold
    ctx.font = `600 36px ${FONT_SERIF}`
    ctx.fillText('解读', PAD, interpTop + 36)
    ctx.strokeStyle = 'rgba(220,171,68,0.35)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(PAD, interpTop + 52)
    ctx.lineTo(W - PAD, interpTop + 52)
    ctx.stroke()
    ctx.fillStyle = C.ink
    ctx.font = `400 ${bodyPx}px ${FONT_SANS}`
    interpLines.forEach((ln, i) => ctx.fillText(ln, PAD, interpTop + 100 + i * lineH))
  }

  // ── footer: value props + QR + caption ──
  const footTop = H - footerH + 16
  // value-prop pills — the selling points, front and center
  drawPills(ctx, W / 2, footTop, ['AI 智能解牌', '数据不出本机', '开源 · 隐私优先'])
  const divY = footTop + 84
  ctx.strokeStyle = 'rgba(220,171,68,0.3)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(PAD, divY)
  ctx.lineTo(W - PAD, divY)
  ctx.stroke()
  const qrSize = 150
  const qrX = PAD
  const qrY = divY + 22
  // parchment panel for scan contrast
  ctx.fillStyle = C.parchment
  roundRect(ctx, qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 14)
  ctx.fill()
  ctx.drawImage(qr, qrX, qrY, qrSize, qrSize)
  // caption — lead with AI, then privacy, then source
  ctx.textAlign = 'left'
  const tx = qrX + qrSize + 36
  ctx.fillStyle = C.goldHi
  ctx.font = `600 34px ${FONT_SERIF}`
  ctx.fillText('扫码 · 让 AI 为你解读', tx, qrY + 34)
  ctx.fillStyle = C.ink2
  ctx.font = `400 25px ${FONT_SANS}`
  ctx.fillText('纯浏览器运行 · 不注册 · 不收集任何个人数据', tx, qrY + 78)
  ctx.fillStyle = C.ink3
  ctx.font = `400 23px ${FONT_SANS}`
  ctx.fillText('开源 · github.com/anois/tarot', tx, qrY + 116)

  return canvas.toDataURL('image/png')
}
