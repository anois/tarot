import type { StreamEvent } from '../types'

/**
 * Parse an OpenAI-style SSE stream (DeepSeek / OpenRouter / OpenAI): a sequence
 * of `data: {json}` lines whose `choices[0].delta.content` carries text, ending
 * with `data: [DONE]`. Tolerant of keep-alive blanks, `:` comments, CRLF, and
 * lines split across chunk boundaries.
 */
export async function* parseOpenAISSE(
  chunks: AsyncIterable<string>,
): AsyncGenerator<StreamEvent> {
  let buffer = ''
  let done = false

  function* handleLine(rawLine: string): Generator<StreamEvent> {
    const line = rawLine.replace(/\r$/, '')
    if (!line || line.startsWith(':')) return
    if (!line.startsWith('data:')) return
    const data = line.slice(5).trim()
    if (data === '[DONE]') {
      done = true
      return
    }
    try {
      const json = JSON.parse(data)
      const delta = json?.choices?.[0]?.delta?.content
      if (typeof delta === 'string' && delta.length > 0) {
        yield { type: 'delta', text: delta }
      }
    } catch {
      // partial/keep-alive; ignore
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
  // flush any trailing line without a newline
  if (buffer.length > 0) {
    yield* handleLine(buffer)
  }
  yield { type: 'done' }
}
