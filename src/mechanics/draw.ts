import type { SpreadPosition } from '@/spreads/types'
import type { DrawnCard } from './types'
import { cryptoSource, randBool, type RandomSource } from './rng'

/**
 * Map the user's ordered card selection onto the spread's positions and decide
 * each card's orientation. Orientation is an INDEPENDENT per-card coin (decided
 * here, after the shuffle/selection) so position never predicts orientation.
 *
 * @param selectedCardIds  card ids in the user's pick order (selection k -> positions[k])
 * @param positions        the spread positions (sorted by `index` internally)
 * @param reversedProbability  Bernoulli p for a reversed card; 0 disables reversals
 */
export function buildDrawnCards(
  selectedCardIds: readonly string[],
  positions: readonly SpreadPosition[],
  reversedProbability: number,
  src: RandomSource = cryptoSource,
): DrawnCard[] {
  const ordered = [...positions].sort((a, b) => a.index - b.index)
  if (selectedCardIds.length !== ordered.length) {
    throw new Error(
      `selected ${selectedCardIds.length} cards but spread has ${ordered.length} positions`,
    )
  }
  const seen = new Set<string>()
  for (const id of selectedCardIds) {
    if (seen.has(id)) throw new Error(`duplicate card selected: ${id}`)
    seen.add(id)
  }
  return ordered.map((pos, i) => ({
    positionId: pos.id,
    index: pos.index,
    cardId: selectedCardIds[i],
    reversed: randBool(reversedProbability, src),
  }))
}
