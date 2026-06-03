import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ReadingTemplate } from '@/reading/types'
import type { BackStyleId, ClothStyleId, FaceStyleId } from '@/features/deck3d/skins'

interface PrefsState {
  defaultTemplate: ReadingTemplate
  defaultReversedProbability: number
  lastSpreadUuid?: string
  /** User override; the runtime also honors the OS prefers-reduced-motion. */
  forceReducedMotion: boolean
  // Deck appearance
  deckBack: BackStyleId
  cardFace: FaceStyleId
  tableCloth: ClothStyleId
  setDefaultTemplate: (t: ReadingTemplate) => void
  setReversedProbability: (p: number) => void
  setLastSpreadUuid: (uuid?: string) => void
  setForceReducedMotion: (v: boolean) => void
  setDeckBack: (id: BackStyleId) => void
  setCardFace: (id: FaceStyleId) => void
  setTableCloth: (id: ClothStyleId) => void
}

export const usePrefs = create<PrefsState>()(
  persist(
    (set) => ({
      defaultTemplate: 'structured',
      defaultReversedProbability: 0.5,
      forceReducedMotion: false,
      deckBack: 'arcane-gold',
      cardFace: 'classic',
      tableCloth: 'velvet-indigo',
      setDefaultTemplate: (defaultTemplate) => set({ defaultTemplate }),
      setReversedProbability: (defaultReversedProbability) => set({ defaultReversedProbability }),
      setLastSpreadUuid: (lastSpreadUuid) => set({ lastSpreadUuid }),
      setForceReducedMotion: (forceReducedMotion) => set({ forceReducedMotion }),
      setDeckBack: (deckBack) => set({ deckBack }),
      setCardFace: (cardFace) => set({ cardFace }),
      setTableCloth: (tableCloth) => set({ tableCloth }),
    }),
    { name: 'tarot.prefs', version: 2 },
  ),
)
