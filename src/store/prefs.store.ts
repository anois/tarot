import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ReadingTemplate } from '@/reading/types'

interface PrefsState {
  defaultTemplate: ReadingTemplate
  defaultReversedProbability: number
  lastSpreadUuid?: string
  /** User override; the runtime also honors the OS prefers-reduced-motion. */
  forceReducedMotion: boolean
  setDefaultTemplate: (t: ReadingTemplate) => void
  setReversedProbability: (p: number) => void
  setLastSpreadUuid: (uuid?: string) => void
  setForceReducedMotion: (v: boolean) => void
}

export const usePrefs = create<PrefsState>()(
  persist(
    (set) => ({
      defaultTemplate: 'structured',
      defaultReversedProbability: 0.5,
      forceReducedMotion: false,
      setDefaultTemplate: (defaultTemplate) => set({ defaultTemplate }),
      setReversedProbability: (defaultReversedProbability) => set({ defaultReversedProbability }),
      setLastSpreadUuid: (lastSpreadUuid) => set({ lastSpreadUuid }),
      setForceReducedMotion: (forceReducedMotion) => set({ forceReducedMotion }),
    }),
    { name: 'tarot.prefs' },
  ),
)
