import { describe, expect, it, beforeEach } from 'vitest'
import { BUILTIN_SPREADS, getBuiltinSpread } from './registry'
import { SPREAD_CATEGORIES } from './categories'
import { validateSpread } from './validate'
import { parseSpreadJson, spreadToJson } from './io'
import { isAllowedImageMime, isSafeImageDataUrl } from '@/lib/image-sanitize'
import { listStoredSpreads, saveSpread, getStoredSpread, deleteStoredSpread } from './repo'
import { db } from '@/db/db'
import type { Spread } from './types'

const base = (): Spread => structuredClone(getBuiltinSpread('three-card')!)

describe('built-in spreads', () => {
  it('ships the expected built-ins', () => {
    const ids = BUILTIN_SPREADS.map((s) => s.id).sort()
    expect(ids).toEqual(
      [
        'admirer',
        'career',
        'career-cross',
        'celtic-cross',
        'chakra',
        'crush',
        'decision',
        'horseshoe',
        'mind-body-spirit',
        'pentagram',
        'relationship',
        'relationship-cross',
        'reunite',
        'single',
        'single-no-more',
        'situation-action-outcome',
        'situationship',
        'three-card',
        'true-love',
        'wealth',
        'wealth-flow',
        'year-ahead',
        'yes-no-clarifier',
        'zodiac-houses',
      ].sort(),
    )
  })

  it('every built-in has a known theme category', () => {
    const known = new Set(SPREAD_CATEGORIES.map((c) => c.id))
    for (const s of BUILTIN_SPREADS) {
      expect(known.has(s.category as never), `${s.id} category=${s.category}`).toBe(true)
    }
  })

  it('all built-ins are valid and cardCount matches positions', () => {
    for (const s of BUILTIN_SPREADS) {
      const r = validateSpread(s)
      expect(r.ok, `${s.id}: ${r.ok ? '' : JSON.stringify(r.issues)}`).toBe(true)
      expect(s.cardCount).toBe(s.positions.length)
    }
  })

  it('celtic-cross has the crossing card on top at the same center', () => {
    const cc = getBuiltinSpread('celtic-cross')!
    const present = cc.positions.find((p) => p.id === 'present')!
    const challenge = cc.positions.find((p) => p.id === 'challenge')!
    expect(challenge.x).toBe(present.x)
    expect(challenge.y).toBe(present.y)
    expect(challenge.rotation).toBe(90)
    expect(challenge.z).toBeGreaterThan(present.z)
  })

  it('all position coordinates are within [0,1]', () => {
    for (const s of BUILTIN_SPREADS) {
      for (const p of s.positions) {
        expect(p.x).toBeGreaterThanOrEqual(0)
        expect(p.x).toBeLessThanOrEqual(1)
        expect(p.y).toBeGreaterThanOrEqual(0)
        expect(p.y).toBeLessThanOrEqual(1)
      }
    }
  })
})

describe('validateSpread invariants', () => {
  it('rejects cardCount != positions.length', () => {
    const s = base()
    s.cardCount = 5
    const r = validateSpread(s)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.issues.some((i) => i.path === 'cardCount')).toBe(true)
  })

  it('rejects duplicate position ids', () => {
    const s = base()
    s.positions[1].id = s.positions[0].id
    expect(validateSpread(s).ok).toBe(false)
  })

  it('rejects duplicate indices', () => {
    const s = base()
    s.positions[1].index = s.positions[0].index
    expect(validateSpread(s).ok).toBe(false)
  })

  it('rejects indices that do not form 1..N', () => {
    const s = base()
    s.positions[2].index = 9
    expect(validateSpread(s).ok).toBe(false)
  })

  it('rejects x/y out of [0,1]', () => {
    const s = base()
    s.positions[0].x = 1.4
    expect(validateSpread(s).ok).toBe(false)
  })

  it('rejects a bad spec prefix', () => {
    const s = base() as unknown as { spec: string }
    s.spec = 'tarot-spread/2.0'
    expect(validateSpread(s).ok).toBe(false)
  })

  it('rejects empty label and empty meaning', () => {
    const a = base()
    a.positions[0].label = ''
    expect(validateSpread(a).ok).toBe(false)
    const b = base()
    b.positions[0].meaning = ''
    expect(validateSpread(b).ok).toBe(false)
  })

  it('rejects a dataURL background with no value', () => {
    const s = base()
    s.background = { type: 'dataURL' }
    expect(validateSpread(s).ok).toBe(false)
  })

  it('accepts a valid custom spread', () => {
    expect(validateSpread(base()).ok).toBe(true)
  })
})

describe('import / export round-trip', () => {
  it('export then parse yields an equal spread', () => {
    const s = getBuiltinSpread('celtic-cross')!
    const json = spreadToJson(s)
    const r = parseSpreadJson(json)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.spread).toEqual(s)
  })

  it('surfaces a JSON parse error gracefully', () => {
    const r = parseSpreadJson('{ not valid json ]')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.issues[0].path).toBe('(root)')
  })
})

describe('image guards', () => {
  it('allows png/jpeg/webp, rejects svg/gif', () => {
    expect(isAllowedImageMime('image/png')).toBe(true)
    expect(isAllowedImageMime('image/jpeg')).toBe(true)
    expect(isAllowedImageMime('image/webp')).toBe(true)
    expect(isAllowedImageMime('image/svg+xml')).toBe(false)
    expect(isAllowedImageMime('image/gif')).toBe(false)
  })

  it('validates safe image data URLs', () => {
    expect(isSafeImageDataUrl('data:image/png;base64,iVBORw0KGgo=')).toBe(true)
    expect(isSafeImageDataUrl('data:image/svg+xml;base64,PHN2Zz4=')).toBe(false)
    expect(isSafeImageDataUrl('data:text/html;base64,PGgxPg==')).toBe(false)
    expect(isSafeImageDataUrl('javascript:alert(1)')).toBe(false)
  })
})

describe('spreads repo (IndexedDB round-trip)', () => {
  beforeEach(async () => {
    await db.spreads.clear()
  })

  it('saves, gets, lists and deletes a stored spread', async () => {
    const stored = await saveSpread(base(), { builtinId: 'three-card' })
    expect(stored.uuid).toBeTruthy()
    const got = await getStoredSpread(stored.uuid)
    expect(got?.spread.id).toBe('three-card')
    expect(got?.builtinId).toBe('three-card')

    const list = await listStoredSpreads()
    expect(list).toHaveLength(1)

    await deleteStoredSpread(stored.uuid)
    expect(await getStoredSpread(stored.uuid)).toBeUndefined()
  })

  it('updates in place when given an existing uuid (preserves createdAt)', async () => {
    const first = await saveSpread(base())
    const createdAt = first.createdAt
    const edited = base()
    edited.name = '改名后的牌阵'
    const second = await saveSpread(edited, { uuid: first.uuid })
    expect(second.uuid).toBe(first.uuid)
    expect(second.createdAt).toBe(createdAt)
    expect(second.spread.name).toBe('改名后的牌阵')
    expect(await listStoredSpreads()).toHaveLength(1)
  })
})
