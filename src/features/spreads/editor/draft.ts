import type { Spread, SpreadPosition } from '@/spreads/types'
import { newUuid } from '@/lib/uuid'

const round3 = (n: number) => Math.round(n * 1000) / 1000
const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

export function makeBlankSpread(): Spread {
  return {
    spec: 'tarot-spread/1.0',
    id: `custom-${newUuid().slice(0, 8)}`,
    name: '我的牌阵',
    description: '',
    cardCount: 1,
    aspectRatio: 1.4,
    card: { widthRatio: 0.16, heightRatio: 0.3 },
    positions: [
      { id: `pos-${newUuid().slice(0, 6)}`, index: 1, label: '牌位 1', x: 0.5, y: 0.5, rotation: 0, z: 0, meaning: '含义' },
    ],
  }
}

/** Reassign indices to 1..n by current index order. */
function reindex(positions: SpreadPosition[]): SpreadPosition[] {
  return [...positions]
    .sort((a, b) => a.index - b.index)
    .map((p, i) => ({ ...p, index: i + 1 }))
}

export function addPosition(spread: Spread): Spread {
  const positions = [
    ...spread.positions,
    {
      id: `pos-${newUuid().slice(0, 6)}`,
      index: spread.positions.length + 1,
      label: `牌位 ${spread.positions.length + 1}`,
      x: 0.5,
      y: 0.5,
      rotation: 0,
      z: 0,
      meaning: '含义',
    },
  ]
  return { ...spread, positions, cardCount: positions.length }
}

export function deletePosition(spread: Spread, id: string): Spread {
  const positions = reindex(spread.positions.filter((p) => p.id !== id))
  return { ...spread, positions, cardCount: positions.length }
}

export function updatePosition(spread: Spread, id: string, patch: Partial<SpreadPosition>): Spread {
  return {
    ...spread,
    positions: spread.positions.map((p) => (p.id === id ? { ...p, ...patch } : p)),
  }
}

export function movePosition(spread: Spread, id: string, x: number, y: number): Spread {
  return updatePosition(spread, id, { x: round3(clamp01(x)), y: round3(clamp01(y)) })
}
