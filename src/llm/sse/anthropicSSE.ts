import type { StreamEvent } from '../types'

/**
 * Parse Anthropic's named-event SSE. Each `data:` line carries a JSON object with
 * a `type`: `content_block_delta` events hold `delta.text`; `message_stop` ends
 * the stream. (We key off the JSON `type`, so the `event:` lines can be ignored.)
 */
export async function* parseAnthropicSSE(
  chunks: AsyncIterable<string>,
): AsyncGenerator<StreamEvent> {
  let buffer = ''
  let done = false

  function* handleLine(rawLine: string): Generator<StreamEvent> {
    const line = rawLine.replace(/\r$/, '')
    if (!line.startsWith('data:')) return
    const data = line.slice(5).trim()
    if (!data) return
    try {
      const json = JSON.parse(data)
      if (json?.type === 'content_block_delta') {
        const text = json?.delta?.text
        if (typeof text === 'string' && text.length > 0) {
          yield { type: 'delta', text }
        }
      } else if (json?.type === 'message_stop') {
        done = true
      } else if (json?.type === 'error') {
        yield { type: 'error', error: { kind: 'server', message: json?.error?.message ?? '流式错误' } }
        done = true
      }
    } catch {
      // ignore
    }
  }

  for await (const chunk of chunks) {
    buffer += chunk
    let idx: number
    while ((idx = buffer.indexOf('\n')) >= 0) {
      const rawLine = buffer.slice(0, idx)
      buffer = buffer.slice(idx + 1)
      yield* handleLine(rawLine)
      if (done) {
        yield { type: 'done' }
        return
      }
    }
  }
  if (buffer.length > 0) yield* handleLine(buffer)
  yield { type: 'done' }
}
