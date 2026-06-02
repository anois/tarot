/** A card the user drew, mapped to a spread position with its orientation. */
export interface DrawnCard {
  /** -> SpreadPosition.id */
  positionId: string
  /** Draw order (mirrors the position index). */
  index: number
  /** -> Card.id */
  cardId: string
  reversed: boolean
}
