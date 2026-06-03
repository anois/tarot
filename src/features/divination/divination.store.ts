import { create } from 'zustand'
import type { Spread } from '@/spreads/types'
import type { DrawnCard } from '@/mechanics/types'
import type { ReadingTemplate, ReadingTurn } from '@/reading/types'
import { CARD_IDS, MAJOR_CARD_IDS } from '@/features/deck3d/layout'
import { shuffle } from '@/mechanics/shuffle'
import { buildDrawnCards } from '@/mechanics/draw'
import { newUuid } from '@/lib/uuid'

export type Phase = 'idle' | 'shuffling' | 'picking' | 'revealing' | 'done'

const activePool = (majorOnly: boolean): string[] => (majorOnly ? MAJOR_CARD_IDS : CARD_IDS)

interface DivinationState {
  phase: Phase
  spread: Spread | null
  question: string
  template: ReadingTemplate
  reversedProbability: number
  /** Restrict the deck to the 22 Major Arcana. */
  majorOnly: boolean
  /** Shuffled card ids; mesh i in the picking deck shows deckOrder[i]. */
  deckOrder: string[]
  /** Selected card ids in pick order (length 0..cardCount). */
  picked: string[]
  drawn: DrawnCard[]
  hovered: number | null
  /** Coverflow focus index (which deck position is centered/front while picking). */
  centered: number

  // interpretation
  turns: ReadingTurn[]
  streaming: string | null
  interpreting: boolean
  interpretError: string | null
  /** Stable id for the current reading record (set when cards are confirmed). */
  readingId: string | null
  /** Which revealed card's detail panel is open (positionId), or null. */
  selectedPositionId: string | null

  setSpread: (s: Spread | null) => void
  setQuestion: (q: string) => void
  setTemplate: (t: ReadingTemplate) => void
  setReversedProbability: (p: number) => void
  setMajorOnly: (v: boolean) => void
  setHovered: (i: number | null) => void

  startShuffle: () => void
  finishShuffle: () => void
  pick: (cardId: string) => void
  setCentered: (i: number) => void
  stepCentered: (delta: number) => void
  pickCentered: () => void
  undoLast: () => void
  confirm: () => void
  finishReveal: () => void
  reset: () => void

  beginInterpret: () => void
  appendStream: (text: string) => void
  commitTurn: (turn: ReadingTurn) => void
  failInterpret: (message: string) => void
  selectCard: (positionId: string | null) => void
}

export const useDivination = create<DivinationState>((set, get) => ({
  phase: 'idle',
  spread: null,
  question: '',
  template: 'structured',
  reversedProbability: 0.5,
  majorOnly: false,
  deckOrder: CARD_IDS.slice(),
  picked: [],
  drawn: [],
  hovered: null,
  centered: 0,
  turns: [],
  streaming: null,
  interpreting: false,
  interpretError: null,
  readingId: null,
  selectedPositionId: null,

  setSpread: (spread) =>
    set({ spread, phase: 'idle', picked: [], drawn: [], turns: [], streaming: null, readingId: null }),
  setQuestion: (question) => set({ question }),
  setTemplate: (template) => set({ template }),
  setReversedProbability: (reversedProbability) => set({ reversedProbability }),
  setMajorOnly: (majorOnly) =>
    set({
      majorOnly,
      deckOrder: activePool(majorOnly).slice(),
      phase: 'idle',
      picked: [],
      drawn: [],
      hovered: null,
    }),
  setHovered: (hovered) => set({ hovered }),

  startShuffle: () => {
    if (!get().spread) return
    set({
      phase: 'shuffling',
      picked: [],
      drawn: [],
      hovered: null,
      turns: [],
      streaming: null,
      interpretError: null,
    })
  },
  finishShuffle: () =>
    set((s) => {
      if (s.phase !== 'shuffling') return {} // ignore the late Deck timer after a tap-to-skip
      const order = shuffle(activePool(s.majorOnly))
      return {
        phase: 'picking',
        deckOrder: order,
        picked: [],
        hovered: null,
        centered: Math.floor(order.length / 2),
      }
    }),

  pick: (cardId) => {
    const { phase, picked, spread } = get()
    if (phase !== 'picking' || !spread) return
    if (picked.includes(cardId)) return
    if (picked.length >= spread.cardCount) return
    set({ picked: [...picked, cardId] })
  },
  setCentered: (i) =>
    set((s) => ({ centered: Math.max(0, Math.min(s.deckOrder.length - 1, Math.round(i))) })),
  stepCentered: (delta) =>
    set((s) => ({ centered: Math.max(0, Math.min(s.deckOrder.length - 1, s.centered + delta)) })),
  pickCentered: () => {
    const { phase, deckOrder, centered } = get()
    if (phase !== 'picking') return
    get().pick(deckOrder[centered])
  },
  undoLast: () => {
    const { phase, picked } = get()
    if (phase !== 'picking' || picked.length === 0) return
    set({ picked: picked.slice(0, -1) })
  },
  confirm: () => {
    const { phase, picked, spread, reversedProbability } = get()
    if (phase !== 'picking' || !spread || picked.length !== spread.cardCount) return
    const drawn = buildDrawnCards(picked, spread.positions, reversedProbability)
    set({ phase: 'revealing', drawn, hovered: null, readingId: newUuid() })
  },
  finishReveal: () => {
    if (get().phase === 'revealing') set({ phase: 'done' })
  },
  reset: () =>
    set({
      phase: 'idle',
      picked: [],
      drawn: [],
      hovered: null,
      turns: [],
      streaming: null,
      interpreting: false,
      interpretError: null,
      readingId: null,
      selectedPositionId: null,
    }),

  beginInterpret: () => set({ interpreting: true, streaming: '', interpretError: null }),
  appendStream: (text) => set((s) => ({ streaming: (s.streaming ?? '') + text })),
  commitTurn: (turn) =>
    set((s) => ({ turns: [...s.turns, turn], streaming: null, interpreting: false })),
  failInterpret: (message) =>
    set({ interpreting: false, streaming: null, interpretError: message }),
  selectCard: (selectedPositionId) => set({ selectedPositionId }),
}))

// Dev-only handle for manual/automated testing in the browser console.
if (import.meta.env.DEV) {
  ;(globalThis as unknown as { __divination?: typeof useDivination }).__divination = useDivination
}
