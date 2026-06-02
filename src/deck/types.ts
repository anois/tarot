/** Immutable identity of a tarot card and the data joined to it. */
export type Suit = 'wands' | 'cups' | 'swords' | 'pentacles'
export type Arcana = 'major' | 'minor'
export type Rank =
  | '01'
  | '02'
  | '03'
  | '04'
  | '05'
  | '06'
  | '07'
  | '08'
  | '09'
  | '10'
  | 'page'
  | 'knight'
  | 'queen'
  | 'king'

export interface Card {
  /** Stable join key, e.g. "major_00" | "wands_01". */
  id: string
  arcana: Arcana
  suit?: Suit
  rank?: Rank
  /** 0..21 for Major Arcana. */
  majorNumber?: number
  nameZh: string
  nameEn: string
  /** Image base name -> /deck/<imageKey>.(webp|ktx2). */
  imageKey: string
}

/** Card meanings (CC0 dariusk/corpora; light = upright, shadow = reversed). */
export interface CardMeaning {
  id: string
  keywords: string[]
  fortuneTelling: string[]
  upright: string[]
  reversed: string[]
}

export interface DeckCard extends Card {
  meaning: CardMeaning
}
