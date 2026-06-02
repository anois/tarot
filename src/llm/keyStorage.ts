import type { RememberMode } from './types'

const KEY = 'tarot.llm.key'

export interface StoredKey {
  apiKey: string
  remember: RememberMode
}

/** Load the remembered key. sessionStorage takes precedence over localStorage. */
export function loadStoredKey(): StoredKey | null {
  try {
    const fromSession = sessionStorage.getItem(KEY)
    if (fromSession) return { apiKey: JSON.parse(fromSession).apiKey, remember: 'session' }
    const fromLocal = localStorage.getItem(KEY)
    if (fromLocal) return { apiKey: JSON.parse(fromLocal).apiKey, remember: 'local' }
  } catch {
    /* ignore */
  }
  return null
}

/** Persist (or clear) the key according to the chosen remember mode. */
export function persistKey(apiKey: string, remember: RememberMode): void {
  try {
    sessionStorage.removeItem(KEY)
    localStorage.removeItem(KEY)
    if (!apiKey || remember === 'none') return
    const payload = JSON.stringify({ apiKey })
    if (remember === 'session') sessionStorage.setItem(KEY, payload)
    else if (remember === 'local') localStorage.setItem(KEY, payload)
  } catch {
    /* ignore (storage may be unavailable) */
  }
}
