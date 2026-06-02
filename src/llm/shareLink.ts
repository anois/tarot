import type { LLMConfig, LLMProvider } from './types'

const PREFIX = 'cfg='
const KNOWN_PROVIDERS: LLMProvider[] = ['deepseek', 'openrouter', 'anthropic', 'custom']

interface SharePayload {
  v: 1
  provider: LLMProvider
  baseUrl: string
  model: string
  temperature?: number
  apiKey?: string
}

function encodeBase64Url(s: string): string {
  const bytes = new TextEncoder().encode(s)
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function decodeBase64Url(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64)
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/**
 * Build a shareable link. The config is encoded in the URL FRAGMENT (`#…`),
 * which browsers never send to any server. When `includeKey` is true the link
 * carries the sharer's API key so a key-less recipient can use it directly.
 */
export function buildShareLink(config: LLMConfig, includeKey: boolean): string {
  const payload: SharePayload = {
    v: 1,
    provider: config.provider,
    baseUrl: config.baseUrl,
    model: config.model,
    temperature: config.temperature,
    ...(includeKey && config.apiKey ? { apiKey: config.apiKey } : {}),
  }
  const encoded = encodeBase64Url(JSON.stringify(payload))
  // Land the recipient at the app home (respecting any deploy base path).
  return `${location.origin}${import.meta.env.BASE_URL}#${PREFIX}${encoded}`
}

export interface SharedConfig {
  provider?: LLMProvider
  baseUrl?: string
  model?: string
  temperature?: number
  apiKey?: string
  hasKey: boolean
}

/** Parse a `#cfg=…` fragment into a partial config, or null if absent/invalid. */
export function parseSharedConfigFromHash(hash: string): SharedConfig | null {
  const h = hash.startsWith('#') ? hash.slice(1) : hash
  if (!h.startsWith(PREFIX)) return null
  try {
    const payload = JSON.parse(decodeBase64Url(h.slice(PREFIX.length))) as SharePayload
    if (!payload || typeof payload !== 'object') return null
    const provider =
      payload.provider && KNOWN_PROVIDERS.includes(payload.provider) ? payload.provider : undefined
    return {
      provider,
      baseUrl: typeof payload.baseUrl === 'string' ? payload.baseUrl : undefined,
      model: typeof payload.model === 'string' ? payload.model : undefined,
      temperature: typeof payload.temperature === 'number' ? payload.temperature : undefined,
      apiKey: typeof payload.apiKey === 'string' ? payload.apiKey : undefined,
      hasKey: typeof payload.apiKey === 'string' && payload.apiKey.length > 0,
    }
  } catch {
    return null
  }
}
