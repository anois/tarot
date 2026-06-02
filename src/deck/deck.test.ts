import { describe, expect, it } from 'vitest'
import { CARDS, RANKS, SUITS } from './cards'
import { MEANINGS, MEANING_BY_ID } from './meanings'
import { DECK } from './deck'

describe('deck data', () => {
  it('has exactly 78 cards', () => {
    expect(CARDS).toHaveLength(78)
  })

  it('has 22 Major and 56 Minor cards', () => {
    expect(CARDS.filter((c) => c.arcana === 'major')).toHaveLength(22)
    expect(CARDS.filter((c) => c.arcana === 'minor')).toHaveLength(56)
  })

  it('has 14 cards per suit', () => {
    for (const suit of SUITS) {
      expect(CARDS.filter((c) => c.suit === suit)).toHaveLength(14)
    }
  })

  it('has unique ids and image keys', () => {
    const ids = new Set(CARDS.map((c) => c.id))
    expect(ids.size).toBe(78)
    const keys = new Set(CARDS.map((c) => c.imageKey))
    expect(keys.size).toBe(78)
  })

  it('has Chinese and English names for every card', () => {
    for (const c of CARDS) {
      expect(c.nameZh.length).toBeGreaterThan(0)
      expect(c.nameEn.length).toBeGreaterThan(0)
    }
  })

  it('Major Arcana numbers run 0..21', () => {
    const nums = CARDS.filter((c) => c.arcana === 'major')
      .map((c) => c.majorNumber!)
      .sort((a, b) => a - b)
    expect(nums).toEqual(Array.from({ length: 22 }, (_, i) => i))
  })

  it('uses pentacles, not coins, as a suit', () => {
    expect(SUITS).toContain('pentacles')
    expect(SUITS as readonly string[]).not.toContain('coins')
    expect(RANKS).toHaveLength(14)
  })
})

describe('meanings join', () => {
  it('has exactly 78 meanings', () => {
    expect(MEANINGS).toHaveLength(78)
  })

  it('every card joins to a meaning (no orphans either direction)', () => {
    // each card has a meaning
    for (const c of CARDS) {
      expect(MEANING_BY_ID.has(c.id), `missing meaning for ${c.id}`).toBe(true)
    }
    // each meaning maps to a real card id
    const cardIds = new Set(CARDS.map((c) => c.id))
    for (const m of MEANINGS) {
      expect(cardIds.has(m.id), `meaning id ${m.id} has no card`).toBe(true)
    }
  })

  it('DECK is 78 fully-joined DeckCards with non-empty meaning arrays', () => {
    expect(DECK).toHaveLength(78)
    for (const d of DECK) {
      expect(d.meaning.id).toBe(d.id)
      expect(d.meaning.upright.length).toBeGreaterThan(0)
      expect(d.meaning.reversed.length).toBeGreaterThan(0)
      expect(d.meaning.keywords.length).toBeGreaterThan(0)
    }
  })
})
