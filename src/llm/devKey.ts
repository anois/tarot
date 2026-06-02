export interface DevPrefill {
  apiKey?: string
  baseUrl?: string
  model?: string
}

/**
 * Dev-only convenience: pre-fill the LLM config from `.env` while running
 * `pnpm dev`. In a production build `import.meta.env.DEV` is statically `false`,
 * so this entire branch is dead-code-eliminated and NO key string ever reaches
 * the shipped bundle. The app is strictly BYOK in production.
 */
export function getDevPrefill(): DevPrefill {
  if (!import.meta.env.DEV) return {}
  return {
    apiKey: import.meta.env.VITE_DEV_LLM_API_KEY || undefined,
    baseUrl: import.meta.env.VITE_DEV_LLM_BASE_URL || undefined,
    model: import.meta.env.VITE_DEV_LLM_MODEL || undefined,
  }
}
