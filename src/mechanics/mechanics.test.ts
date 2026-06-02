import { describe, expect, it } from 'vitest'
import { cryptoSource, mulberry32, randBool, randFloat, randInt, type RandomSource } from './rng'
import { shuffle } from './shuffle'
import { buildDrawnCards } from './draw'
import type { SpreadPosition } from '@/spreads/types'

describe('randInt', () => {
  it('never returns >= maxExclusive and never negative', () => {
    for (let i = 0; i < 5000; i++) {
      const v = randInt(7)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(7)
    }
  })

  it('returns 0 for maxExclusive === 1', () => {
    expect(randInt(1)).toBe(0)
  })

  it('throws on invalid bounds', () => {
    expect(() => randInt(0)).toThrow(RangeError)
    expect(() => randInt(-3)).toThrow(RangeError)
    expect(() => randInt(2.5)).toThrow(RangeError)
  })

  it('covers the whole range and is roughly uniform (crypto)', () => {
    const n = 6
    const trials = 60_000
    const counts = new Array(n).fill(0)
    for (let i = 0; i < trials; i++) counts[randInt(n)]++
    const expected = trials / n
    for (const c of counts) {
      expect(c).toBeGreaterThan(0)
      // ~8 sigma tolerance: catches gross bias without flaking
      expect(Math.abs(c - expected)).toBeLessThan(expected * 0.08)
    }
  })

  it('is deterministic with a seeded source', () => {
    const seq = (seed: number) => {
      const src = mulberry32(seed)
      return Array.from({ length: 20 }, () => randInt(100, src))
    }
    expect(seq(42)).toEqual(seq(42))
    expect(seq(42)).not.toEqual(seq(43))
  })
})

describe('randBool / randFloat', () => {
  it('p=0 always false, p=1 always true', () => {
    for (let i = 0; i < 1000; i++) {
      expect(randBool(0)).toBe(false)
      expect(randBool(1)).toBe(true)
    }
  })

  it('p=0.5 is ~50% over many trials', () => {
    const trials = 40_000
    let heads = 0
    for (let i = 0; i < trials; i++) if (randBool(0.5)) heads++
    expect(Math.abs(heads - trials / 2)).toBeLessThan(trials * 0.05)
  })

  it('randFloat stays in [0,1)', () => {
    for (let i = 0; i < 5000; i++) {
      const f = randFloat()
      expect(f).toBeGreaterThanOrEqual(0)
      expect(f).toBeLessThan(1)
    }
  })
})

describe('shuffle (Fisher-Yates)', () => {
  it('preserves the multiset and length, does not mutate input', () => {
    const input = Array.from({ length: 78 }, (_, i) => i)
    const out = shuffle(input)
    expect(out).toHaveLength(78)
    expect([...out].sort((a, b) => a - b)).toEqual(input)
    expect(input).toEqual(Array.from({ length: 78 }, (_, i) => i)) // untouched
  })

  it('is deterministic with a seeded source', () => {
    const input = Array.from({ length: 30 }, (_, i) => i)
    const a = shuffle(input, mulberry32(7))
    const b = shuffle(input, mulberry32(7))
    expect(a).toEqual(b)
  })

  it('produces a uniform position distribution (no positional bias)', () => {
    const n = 5
    const trials = 25_000
    // counts[element][position]
    const counts = Array.from({ length: n }, () => new Array(n).fill(0))
    const base = Array.from({ length: n }, (_, i) => i)
    for (let t = 0; t < trials; t++) {
      const out = shuffle(base)
      out.forEach((el, pos) => counts[el][pos]++)
    }
    const expected = trials / n
    for (let el = 0; el < n; el++) {
      for (let pos = 0; pos < n; pos++) {
        // ~9 sigma tolerance; a buggy [0,i) sample would skew far past this
        expect(Math.abs(counts[el][pos] - expected)).toBeLessThan(expected * 0.1)
      }
    }
  })

  it('uses the provided source (no hidden Math.random)', () => {
    let calls = 0
    const counting: RandomSource = {
      nextUint32() {
        calls++
        return cryptoSource.nextUint32()
      },
    }
    shuffle(Array.from({ length: 10 }, (_, i) => i), counting)
    expect(calls).toBeGreaterThanOrEqual(9) // one draw per i from 9..1
  })
})

describe('buildDrawnCards', () => {
  const positions: SpreadPosition[] = [
    { id: 'b', index: 2, label: 'B', x: 0.5, y: 0.5, rotation: 0, z: 0, meaning: '' },
    { id: 'a', index: 1, label: 'A', x: 0.3, y: 0.5, rotation: 0, z: 0, meaning: '' },
    { id: 'c', index: 3, label: 'C', x: 0.7, y: 0.5, rotation: 0, z: 0, meaning: '' },
  ]

  it('maps selection order to positions sorted by index', () => {
    const drawn = buildDrawnCards(['major_00', 'wands_01', 'cups_05'], positions, 0)
    expect(drawn.map((d) => d.positionId)).toEqual(['a', 'b', 'c'])
    expect(drawn.map((d) => d.index)).toEqual([1, 2, 3])
    expect(drawn.map((d) => d.cardId)).toEqual(['major_00', 'wands_01', 'cups_05'])
  })

  it('p=0 yields all upright, p=1 yields all reversed', () => {
    const sel = ['major_00', 'wands_01', 'cups_05']
    expect(buildDrawnCards(sel, positions, 0).every((d) => !d.reversed)).toBe(true)
    expect(buildDrawnCards(sel, positions, 1).every((d) => d.reversed)).toBe(true)
  })

  it('throws when selection count != position count', () => {
    expect(() => buildDrawnCards(['major_00'], positions, 0)).toThrow()
  })

  it('throws on duplicate selected card', () => {
    expect(() => buildDrawnCards(['major_00', 'major_00', 'cups_05'], positions, 0)).toThrow()
  })

  it('reversed orientation is ~50% at p=0.5 across many positions (crypto)', () => {
    const big: SpreadPosition[] = Array.from({ length: 1 }, (_, i) => ({
      id: `p${i}`,
      index: i + 1,
      label: `P${i}`,
      x: 0.5,
      y: 0.5,
      rotation: 0,
      z: 0,
      meaning: '',
    }))
    const trials = 20_000
    let reversed = 0
    for (let t = 0; t < trials; t++) {
      const d = buildDrawnCards(['major_00'], big, 0.5)
      if (d[0].reversed) reversed++
    }
    expect(Math.abs(reversed - trials / 2)).toBeLessThan(trials * 0.05)
  })
})
