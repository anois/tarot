export type LLMProvider = 'deepseek' | 'openrouter' | 'anthropic' | 'custom'

export type RememberMode = 'none' | 'session' | 'local'

export interface LLMConfig {
  provider: LLMProvider
  baseUrl: string
  /** Runtime only — never persisted unless `remember !== 'none'`. */
  apiKey: string
  model: string
  temperature?: number
  remember: RememberMode
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type LLMErrorKind =
  | 'cors'
  | 'auth'
  | 'rate_limit'
  | 'model_not_found'
  | 'network'
  | 'aborted'
  | 'bad_request'
  | 'server'
  | 'unknown'

export interface LLMError {
  kind: LLMErrorKind
  message: string
  status?: number
}

export type StreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done' }
  | { type: 'error'; error: LLMError }

export interface PingResult {
  ok: boolean
  error?: LLMError
}
