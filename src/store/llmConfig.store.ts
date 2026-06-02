import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LLMConfig } from '@/llm/types'
import { getDevPrefill } from '@/llm/devKey'
import { loadStoredKey, persistKey } from '@/llm/keyStorage'
import type { SharedConfig } from '@/llm/shareLink'

interface LLMConfigState {
  config: LLMConfig
  /** Whether the last connectivity check succeeded (gates interpretation). */
  pingOk: boolean
  pingAt?: number
  /** Set when config was just loaded from a share link (for the notice banner). */
  importedFromShare: boolean
  setConfig: (patch: Partial<LLMConfig>) => void
  setPingOk: (ok: boolean) => void
  clearKey: () => void
  applyShared: (shared: SharedConfig) => void
  dismissImportNotice: () => void
}

const dev = getDevPrefill()
const remembered = loadStoredKey()

const initialConfig: LLMConfig = {
  provider: 'deepseek',
  baseUrl: dev.baseUrl ?? 'https://api.deepseek.com',
  apiKey: dev.apiKey ?? remembered?.apiKey ?? '',
  model: dev.model ?? 'deepseek-v4-flash',
  temperature: 0.7,
  remember: remembered?.remember ?? 'none',
}

/**
 * Non-secret config (provider/baseUrl/model/temperature) persists to localStorage
 * via zustand. The apiKey + remember mode are handled separately by keyStorage so
 * the secret only persists when the user explicitly opts in (session/local).
 */
export const useLLMConfig = create<LLMConfigState>()(
  persist(
    (set, get) => ({
      config: initialConfig,
      pingOk: false,
      importedFromShare: false,
      setConfig: (patch) => {
        const next = { ...get().config, ...patch }
        persistKey(next.apiKey, next.remember)
        set({ config: next, pingOk: false, pingAt: undefined })
      },
      setPingOk: (ok) => set({ pingOk: ok, pingAt: ok ? Date.now() : undefined }),
      clearKey: () => {
        persistKey('', 'none')
        set((s) => ({ config: { ...s.config, apiKey: '' }, pingOk: false, pingAt: undefined }))
      },
      applyShared: (shared) => {
        const next = { ...get().config }
        if (shared.provider) next.provider = shared.provider
        if (shared.baseUrl) next.baseUrl = shared.baseUrl
        if (shared.model) next.model = shared.model
        if (shared.temperature != null) next.temperature = shared.temperature
        if (shared.hasKey && shared.apiKey) {
          next.apiKey = shared.apiKey
          // Persist for the session so it survives reloads without keeping the URL.
          next.remember = 'session'
          persistKey(shared.apiKey, 'session')
        }
        set({ config: next, importedFromShare: true, pingOk: false, pingAt: undefined })
      },
      dismissImportNotice: () => set({ importedFromShare: false }),
    }),
    {
      name: 'tarot.llm.cfg',
      // Persist only non-secret fields; key + remember live in keyStorage.
      partialize: (s) => ({
        config: {
          provider: s.config.provider,
          baseUrl: s.config.baseUrl,
          model: s.config.model,
          temperature: s.config.temperature,
        },
      }),
      merge: (persisted, current) => {
        const p = persisted as { config?: Partial<LLMConfig> } | undefined
        return {
          ...current,
          config: {
            ...current.config,
            ...p?.config,
            // keep the runtime key + remember resolved at init
            apiKey: current.config.apiKey,
            remember: current.config.remember,
          },
        }
      },
    },
  ),
)
