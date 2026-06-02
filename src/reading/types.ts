import type { DrawnCard } from '@/mechanics/types'
import type { Spread } from '@/spreads/types'

export type ReadingTemplate = 'structured' | 'narrative' | 'quick' | 'deepdive'

export interface ReadingTurn {
  role: 'reading' | 'followup'
  template: ReadingTemplate
  /** Follow-up question for deepdive turns. */
  question?: string
  /** Deepdive: which position/theme the user is asking about. */
  focusPositionId?: string
  /** Assembled answer (markdown). */
  content: string
  createdAt: number
}

export interface Reading {
  id: string
  createdAt: number
  updatedAt: number
  question: string
  /** Snapshot of the spread AT read time (immutable record). */
  spreadSnapshot: Spread
  drawn: DrawnCard[]
  reversedProbability: number
  turns: ReadingTurn[]
  /** Provider/model label only — never the key. */
  modelUsed: string
}
