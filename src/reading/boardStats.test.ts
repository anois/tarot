import { describe, expect, it } from 'vitest'
import { computeBoardStats } from './boardStats'
import type { DrawnCard } from '@/mechanics/types'

const d = (cardId: string, reversed = false, index = 1): DrawnCard => ({
  positionId: `p${index}`,
  index,
  cardId,
  reversed,
})

describe('computeBoardStats', () => {
  it('counts upright/reversed, major/minor, court and elements', () => {
    const s = computeBoardStats([
      d('major_13', true, 1), // Death, reversed, water, major
      d('wands_05', false, 2), // fire, minor
      d('wands_knight', false, 3), // fire, minor, court
    ])
    expect(s.total).toBe(3)
    expect(s.reversed).toBe(1)
    expect(s.upright).toBe(2)
    expect(s.major).toBe(1)
    expect(s.minor).toBe(2)
    expect(s.court).toBe(1)
    expect(s.elements['火']).toBe(2)
    expect(s.elements['水']).toBe(1)
    expect(s.suits.wands).toBe(2)
  })

  it('flags a dominant element', () => {
    const s = computeBoardStats([d('wands_02', false, 1), d('wands_03', false, 2), d('wands_04', false, 3)])
    expect(s.elements['火']).toBe(3)
    expect(s.features.some((f) => f.includes('火元素偏重'))).toBe(true)
    expect(s.features.some((f) => f.includes('全部正位'))).toBe(true)
  })

  it('flags Major-Arcana density', () => {
    const s = computeBoardStats([d('major_00', false, 1), d('major_10', false, 2), d('cups_03', false, 3)])
    expect(s.features.some((f) => f.includes('大阿卡纳占多数'))).toBe(true)
  })

  it('flags a reversed-heavy board', () => {
    const s = computeBoardStats([d('cups_02', true, 1), d('cups_03', true, 2), d('cups_04', false, 3)])
    expect(s.features.some((f) => f.includes('逆位偏多'))).toBe(true)
  })
})
