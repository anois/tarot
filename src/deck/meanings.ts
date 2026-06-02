import type { CardMeaning, Suit } from './types'
import raw from './data/tarot_interpretations.json'

interface RawEntry {
  name: string
  rank: number | string
  suit: string
  keywords: string[]
  fortune_telling: string[]
  meanings: { light: string[]; shadow: string[] }
}

const ENTRIES = (raw as { tarot_interpretations: RawEntry[] }).tarot_interpretations

/** The corpora dataset labels the coins suit "coins"; we use the RWS "pentacles". */
function normalizeSuit(suit: string): Suit | 'major' {
  if (suit === 'major') return 'major'
  if (suit === 'coins') return 'pentacles'
  return suit as Suit
}

function rawToId(e: RawEntry): string {
  if (e.suit === 'major') {
    return `major_${String(e.rank).padStart(2, '0')}`
  }
  const suit = normalizeSuit(e.suit)
  const rankStr = typeof e.rank === 'number' ? String(e.rank).padStart(2, '0') : e.rank
  return `${suit}_${rankStr}`
}

function buildMeanings(): CardMeaning[] {
  return ENTRIES.map((e) => ({
    id: rawToId(e),
    keywords: e.keywords,
    fortuneTelling: e.fortune_telling,
    upright: e.meanings.light,
    reversed: e.meanings.shadow,
  }))
}

export const MEANINGS: readonly CardMeaning[] = buildMeanings()

export const MEANING_BY_ID: ReadonlyMap<string, CardMeaning> = new Map(
  MEANINGS.map((m) => [m.id, m]),
)

export function getMeaning(id: string): CardMeaning | undefined {
  return MEANING_BY_ID.get(id)
}
