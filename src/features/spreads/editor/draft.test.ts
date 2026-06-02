import { describe, expect, it } from 'vitest'
import { addPosition, deletePosition, makeBlankSpread, movePosition, updatePosition } from './draft'
import { validateSpread } from '@/spreads/validate'

describe('editor draft helpers', () => {
  it('makeBlankSpread produces a valid 1-card spread', () => {
    const s = makeBlankSpread()
    expect(s.cardCount).toBe(1)
    expect(validateSpread(s).ok).toBe(true)
  })

  it('addPosition adds a unique position and bumps cardCount; stays valid', () => {
    let s = makeBlankSpread()
    s = addPosition(s)
    s = addPosition(s)
    expect(s.positions).toHaveLength(3)
    expect(s.cardCount).toBe(3)
    expect(new Set(s.positions.map((p) => p.id)).size).toBe(3)
    expect(s.positions.map((p) => p.index).sort()).toEqual([1, 2, 3])
    expect(validateSpread(s).ok).toBe(true)
  })

  it('deletePosition reindexes to 1..n and stays valid', () => {
    let s = addPosition(addPosition(makeBlankSpread())) // 3 positions
    const middleId = s.positions[1].id
    s = deletePosition(s, middleId)
    expect(s.positions).toHaveLength(2)
    expect(s.cardCount).toBe(2)
    expect(s.positions.map((p) => p.index).sort()).toEqual([1, 2])
    expect(validateSpread(s).ok).toBe(true)
  })

  it('movePosition clamps to [0,1] and rounds to 3 decimals', () => {
    const s = makeBlankSpread()
    const id = s.positions[0].id
    const moved = movePosition(s, id, 1.7, -0.4)
    expect(moved.positions[0].x).toBe(1)
    expect(moved.positions[0].y).toBe(0)
    const mid = movePosition(s, id, 0.123456, 0.654321)
    expect(mid.positions[0].x).toBe(0.123)
    expect(mid.positions[0].y).toBe(0.654)
  })

  it('updatePosition patches only the target position', () => {
    let s = addPosition(makeBlankSpread())
    const id = s.positions[0].id
    s = updatePosition(s, id, { label: '改了', rotation: 90 })
    expect(s.positions[0].label).toBe('改了')
    expect(s.positions[0].rotation).toBe(90)
    expect(s.positions[1].label).not.toBe('改了')
  })
})
