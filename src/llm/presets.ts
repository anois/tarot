import type { LLMProvider } from './types'

export type WireFormat = 'openai' | 'anthropic'

export interface ProviderPreset {
  id: LLMProvider
  label: string
  baseUrl: string
  defaultModel: string
  models: string[]
  wireFormat: WireFormat
  note: string
}

export const PRESETS: Record<LLMProvider, ProviderPreset> = {
  deepseek: {
    id: 'deepseek',
    label: 'DeepSeek（推荐）',
    baseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-v4-flash',
    models: ['deepseek-v4-flash', 'deepseek-v4-pro', 'deepseek-chat', 'deepseek-reasoner'],
    wireFormat: 'openai',
    note: '浏览器可直连，无需后端代理。推荐默认。',
  },
  openrouter: {
    id: 'openrouter',
    label: 'OpenRouter（多模型 / 回退）',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'deepseek/deepseek-chat',
    models: [
      'deepseek/deepseek-chat',
      'anthropic/claude-3.5-sonnet',
      'openai/gpt-4o',
      'meta-llama/llama-3.3-70b-instruct',
    ],
    wireFormat: 'openai',
    note: '通配 CORS，一个密钥可用多种模型。若 DeepSeek 直连失败可改用此项。',
  },
  anthropic: {
    id: 'anthropic',
    label: 'Anthropic（进阶）',
    baseUrl: 'https://api.anthropic.com',
    defaultModel: 'claude-3-5-sonnet-20241022',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
    wireFormat: 'anthropic',
    note: '需特殊浏览器直连请求头；为稳定起见也可通过 OpenRouter 使用 Claude。',
  },
  custom: {
    id: 'custom',
    label: '自定义（OpenAI 兼容）',
    baseUrl: '',
    defaultModel: '',
    models: [],
    wireFormat: 'openai',
    note: '任意 OpenAI 兼容接口；自行确保该接口允许浏览器跨域访问。',
  },
}

export function wireFormatFor(provider: LLMProvider): WireFormat {
  return PRESETS[provider].wireFormat
}
