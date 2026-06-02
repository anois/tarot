import { describe, expect, it } from 'vitest'
import { parseOpenAISSE } from './openaiSSE'
import { parseAnthropicSSE } from './anthropicSSE'
import type { StreamEvent } from '../types'

async function* fromChunks(chunks: string[]): AsyncGenerator<string> {
  for (const c of chunks) yield c
}

async function collect(gen: AsyncGenerator<StreamEvent>): Promise<StreamEvent[]> {
  const out: StreamEvent[] = []
  for await (const e of gen) out.push(e)
  return out
}

const oa = (content: string) => `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`

describe('parseOpenAISSE', () => {
  it('emits deltas then done', async () => {
    const events = await collect(parseOpenAISSE(fromChunks([oa('你'), oa('好'), 'data: [DONE]\n\n'])))
    expect(events).toEqual([
      { type: 'delta', text: '你' },
      { type: 'delta', text: '好' },
      { type: 'done' },
    ])
  })

  it('handles a data line split across chunk boundaries', async () => {
    const full = oa('世界')
    const mid = Math.floor(full.length / 2)
    const events = await collect(
      parseOpenAISSE(fromChunks([full.slice(0, mid), full.slice(mid), 'data: [DONE]\n\n'])),
    )
    expect(events.filter((e) => e.type === 'delta')).toEqual([{ type: 'delta', text: '世界' }])
  })

  it('ignores keep-alive blanks and comment lines', async () => {
    const events = await collect(
      parseOpenAISSE(fromChunks(['\n', ': keep-alive\n', oa('A'), '\n\n', 'data: [DONE]\n\n'])),
    )
    expect(events.filter((e) => e.type === 'delta')).toEqual([{ type: 'delta', text: 'A' }])
    expect(events.at(-1)).toEqual({ type: 'done' })
  })

  it('skips chunks with no content delta (e.g. role-only first chunk)', async () => {
    const roleOnly = `data: ${JSON.stringify({ choices: [{ delta: { role: 'assistant' } }] })}\n\n`
    const events = await collect(parseOpenAISSE(fromChunks([roleOnly, oa('x'), 'data: [DONE]\n\n'])))
    expect(events.filter((e) => e.type === 'delta')).toEqual([{ type: 'delta', text: 'x' }])
  })

  it('terminates with done even without an explicit [DONE]', async () => {
    const events = await collect(parseOpenAISSE(fromChunks([oa('解')])))
    expect(events).toEqual([{ type: 'delta', text: '解' }, { type: 'done' }])
  })
})

const ad = (text: string) => `event: content_block_delta\ndata: ${JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text } })}\n\n`

describe('parseAnthropicSSE', () => {
  it('emits deltas from content_block_delta then done on message_stop', async () => {
    const events = await collect(
      parseAnthropicSSE(
        fromChunks([
          'event: message_start\ndata: {"type":"message_start"}\n\n',
          ad('你'),
          ad('好'),
          'event: message_stop\ndata: {"type":"message_stop"}\n\n',
        ]),
      ),
    )
    expect(events).toEqual([
      { type: 'delta', text: '你' },
      { type: 'delta', text: '好' },
      { type: 'done' },
    ])
  })

  it('handles split chunks and ignores ping events', async () => {
    const full = ad('世界')
    const mid = Math.floor(full.length / 2)
    const events = await collect(
      parseAnthropicSSE(
        fromChunks([
          'event: ping\ndata: {"type":"ping"}\n\n',
          full.slice(0, mid),
          full.slice(mid),
          'data: {"type":"message_stop"}\n\n',
        ]),
      ),
    )
    expect(events.filter((e) => e.type === 'delta')).toEqual([{ type: 'delta', text: '世界' }])
  })

  it('surfaces an error event', async () => {
    const events = await collect(
      parseAnthropicSSE(
        fromChunks(['data: {"type":"error","error":{"message":"overloaded"}}\n\n']),
      ),
    )
    expect(events.some((e) => e.type === 'error')).toBe(true)
  })
})
