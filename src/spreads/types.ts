import type { SpreadCategory } from './categories'

/** A tarot spread definition (tarot-spread/1.x). Coordinates are normalized
 *  to [0,1] and denote each card's CENTER; rotation is degrees clockwise. */
export interface SpreadPosition {
  /** Unique within the spread; stable key the drawn card maps to. */
  id: string
  /** 1-based draw/reveal order. */
  index: number
  label: string
  /** Normalized center X in [0,1] (left→right). */
  x: number
  /** Normalized center Y in [0,1] (top→bottom). */
  y: number
  /** Degrees clockwise. */
  rotation: number
  /** Paint order (higher = on top). */
  z: number
  meaning: string
  /** Optional per-position prompt; may contain the {card} placeholder. */
  prompt?: string
}

export interface SpreadBackground {
  type: 'dataURL' | 'url' | 'none'
  value?: string
  fit?: 'cover' | 'contain' | 'fill'
}

export interface Spread {
  spec: `tarot-spread/1.${number}`
  /** Slug, unique within a library. */
  id: string
  name: string
  description?: string
  /** Theme bucket for browsing (love / career / wealth / …). */
  category?: SpreadCategory
  /** MUST equal positions.length. */
  cardCount: number
  /** Optional layout box aspect ratio hint (width / height). */
  aspectRatio?: number
  /** Per-spread override of reversed probability, 0..1. */
  defaultReversedProbability?: number
  background?: SpreadBackground
  /** Card size as a fraction of the layout box. */
  card: { widthRatio: number; heightRatio: number }
  positions: SpreadPosition[]
}

/** A user-stored spread: the portable Spread plus internal bookkeeping. */
export interface StoredSpread {
  /** Internal uuid (separate from the portable slug `spread.id`). */
  uuid: string
  spread: Spread
  builtinId?: string
  createdAt: number
  updatedAt: number
}
