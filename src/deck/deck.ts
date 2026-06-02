import type { DeckCard } from './types'
import { CARDS } from './cards'
import { MEANING_BY_ID } from './meanings'

/** Join the 78 card identities with their CC0 meanings. Throws if any card
 *  lacks a meaning, so a data drift between the two sources fails loudly. */
function buildDeck(): DeckCard[] {
  return CARDS.map((card) => {
    const meaning = MEANING_BY_ID.get(card.id)
    if (!meaning) {
      throw new Error(`No meaning joined for card id "${card.id}" (${card.nameEn})`)
    }
    return { ...card, meaning }
  })
}

export const DECK: readonly DeckCard[] = buildDeck()

export const DECK_BY_ID: ReadonlyMap<string, DeckCard> = new Map(DECK.map((c) => [c.id, c]))

export function getDeckCard(id: string): DeckCard | undefined {
  return DECK_BY_ID.get(id)
}
