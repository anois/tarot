import type { ChatMessage, LLMConfig, PingResult, StreamEvent } from './types'
import { wireFormatFor, type WireFormat } from './presets'
import { classifyHttpError, classifyThrown } from './errors'
import { parseOpenAISSE } from './sse/openaiSSE'
import { parseAnthropicSSE } from './sse/anthropicSSE'

function joinUrl(base: string, path: string): string {
  return base.replace(/\/+$/, '') + path
}

async function* streamToStrings(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) yield decoder.decode(value, { stream: true })
    }
    const tail = decoder.decode()
    if (tail) yield tail
  } finally {
    reader.releaseLock()
  }
}

interface BuiltRequest {
  url: string
  headers: Record<string, string>
  body: string
  wire: WireFormat
}

function splitSystem(messages: ChatMessage[]): { system: string; rest: ChatMessage[] } {
  const sys = messages.filter((m) => m.role === 'system').map((m) => m.content)
  const rest = messages.filter((m) => m.role !== 'system')
  return { system: sys.join('\n\n'), rest }
}

function buildRequest(config: LLMConfig, messages: ChatMessage[], stream: boolean): BuiltRequest {
  const wire = wireFormatFor(config.provider)
  if (wire === 'anthropic') {
    const { system, rest } = splitSystem(messages)
    return {
      wire,
      url: joinUrl(config.baseUrl, '/v1/messages'),
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: stream ? 4096 : 1,
        system: system || undefined,
        messages: rest.map((m) => ({ role: m.role, content: m.content })),
        temperature: config.temperature,
        stream,
      }),
    }
  }
  // OpenAI-compatible (DeepSeek / OpenRouter / custom)
  return {
    wire,
    url: joinUrl(config.baseUrl, '/chat/completions'),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: config.temperature,
      max_tokens: stream ? undefined : 1,
      stream,
    }),
  }
}

export interface LLMClient {
  chatStream(messages: ChatMessage[], opts?: { signal?: AbortSignal }): AsyncIterable<StreamEvent>
  ping(opts?: { signal?: AbortSignal }): Promise<PingResult>
}

export function createLLMClient(config: LLMConfig): LLMClient {
  async function* chatStream(
    messages: ChatMessage[],
    opts: { signal?: AbortSignal } = {},
  ): AsyncGenerator<StreamEvent> {
    const req = buildRequest(config, messages, true)
    let res: Response
    try {
      res = await fetch(req.url, {
        method: 'POST',
        headers: req.headers,
        body: req.body,
        signal: opts.signal,
      })
    } catch (e) {
      yield { type: 'error', error: classifyThrown(e) }
      return
    }
    if (!res.ok) {
      let text = ''
      try {
        text = await res.text()
      } catch {
        /* ignore */
      }
      yield { type: 'error', error: classifyHttpError(res.status, text) }
      return
    }
    if (!res.body) {
      yield { type: 'error', error: { kind: 'unknown', message: '响应没有数据流。' } }
      return
    }
    const chunks = streamToStrings(res.body)
    const parser = req.wire === 'anthropic' ? parseAnthropicSSE(chunks) : parseOpenAISSE(chunks)
    try {
      for await (const ev of parser) yield ev
    } catch (e) {
      yield { type: 'error', error: classifyThrown(e) }
    }
  }

  async function ping(opts: { signal?: AbortSignal } = {}): Promise<PingResult> {
    const req = buildRequest(config, [{ role: 'user', content: 'ping' }], false)
    try {
      const res = await fetch(req.url, {
        method: 'POST',
        headers: req.headers,
        body: req.body,
        signal: opts.signal,
      })
      if (!res.ok) {
        let text = ''
        try {
          text = await res.text()
        } catch {
          /* ignore */
        }
        return { ok: false, error: classifyHttpError(res.status, text) }
      }
      // drain
      await res.text().catch(() => '')
      return { ok: true }
    } catch (e) {
      return { ok: false, error: classifyThrown(e) }
    }
  }

  return { chatStream, ping }
}
