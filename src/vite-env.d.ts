/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Dev-only convenience pre-fill (see .env.example). Never used in prod builds. */
  readonly VITE_DEV_LLM_API_KEY?: string
  readonly VITE_DEV_LLM_BASE_URL?: string
  readonly VITE_DEV_LLM_MODEL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
