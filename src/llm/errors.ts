import type { LLMError } from './types'

function truncate(s: string, n = 200): string {
  return s.length > n ? s.slice(0, n) + '…' : s
}

/** Classify a non-2xx HTTP response into a user-actionable Chinese message. */
export function classifyHttpError(status: number, body?: string): LLMError {
  if (status === 401 || status === 403) {
    return { kind: 'auth', status, message: '密钥无效或无权限（' + status + '）。请检查 API 密钥。' }
  }
  if (status === 429) {
    return { kind: 'rate_limit', status, message: '请求过于频繁或额度不足（429）。请稍后再试。' }
  }
  if (status === 404) {
    return {
      kind: 'model_not_found',
      status,
      message: '接口或模型不存在（404）。请检查接口地址与模型名。',
    }
  }
  if (status === 400) {
    return {
      kind: 'bad_request',
      status,
      message: body ? `请求有误（400）：${truncate(body)}` : '请求有误（400）。',
    }
  }
  if (status >= 500) {
    return { kind: 'server', status, message: `服务端错误（${status}）。请稍后再试。` }
  }
  return { kind: 'unknown', status, message: `请求失败（${status}）。${body ? truncate(body) : ''}` }
}

/** Classify a thrown fetch error. A bare TypeError almost always means the
 *  browser blocked a cross-origin request (CORS) or the network failed. */
export function classifyThrown(e: unknown): LLMError {
  if (e instanceof DOMException && e.name === 'AbortError') {
    return { kind: 'aborted', message: '已取消。' }
  }
  if (e instanceof TypeError) {
    return {
      kind: 'cors',
      message:
        '无法连接到大模型接口（可能是 CORS 跨域或网络问题）。若该服务商不支持浏览器直连，请将接口地址改为 OpenRouter（https://openrouter.ai/api/v1），或自行部署一个反向代理。',
    }
  }
  return { kind: 'unknown', message: e instanceof Error ? e.message : String(e) }
}
