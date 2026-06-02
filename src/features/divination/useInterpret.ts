import { useCallback, useRef } from 'react'
import { useDivination } from './divination.store'
import { useLLMConfig } from '@/store/llmConfig.store'
import { createLLMClient } from '@/llm/client'
import {
  buildFollowupMessages,
  buildReadingMessages,
  type ReadingContext,
} from '@/prompt/assemble'
import type { Reading, ReadingTemplate, ReadingTurn } from '@/reading/types'
import { putReading } from '@/reading/repo'

/** Orchestrates streaming an interpretation (initial reading or deep-dive). */
export function useInterpret() {
  const abortRef = useRef<AbortController | null>(null)

  const run = useCallback(
    async (kind: 'reading' | 'followup', followup?: { question: string; focusLabel?: string }) => {
      const div = useDivination.getState()
      const { config } = useLLMConfig.getState()
      if (!div.spread || div.drawn.length === 0 || !config.apiKey) return

      const ctx: ReadingContext = {
        question: div.question,
        spread: div.spread,
        drawn: div.drawn,
        template: div.template,
      }
      const template: ReadingTemplate =
        kind === 'followup' ? 'deepdive' : div.template === 'deepdive' ? 'structured' : div.template

      const messages =
        kind === 'followup' && followup
          ? buildFollowupMessages(ctx, div.turns, followup.question, followup.focusLabel)
          : buildReadingMessages(ctx)

      const ac = new AbortController()
      abortRef.current = ac
      div.beginInterpret()

      const client = createLLMClient(config)
      let buffer = ''
      try {
        for await (const ev of client.chatStream(messages, { signal: ac.signal })) {
          if (ev.type === 'delta') {
            buffer += ev.text
            useDivination.getState().appendStream(ev.text)
          } else if (ev.type === 'error') {
            useDivination.getState().failInterpret(ev.error.message)
            return
          } else if (ev.type === 'done') {
            break
          }
        }
      } catch (e) {
        useDivination.getState().failInterpret(e instanceof Error ? e.message : String(e))
        return
      }

      if (!buffer.trim()) {
        useDivination.getState().failInterpret('模型没有返回内容，请重试或更换模型。')
        return
      }

      const turn: ReadingTurn = {
        role: kind,
        template,
        question: followup?.question,
        focusPositionId: undefined,
        content: buffer,
        createdAt: Date.now(),
      }
      useDivination.getState().commitTurn(turn)

      // Auto-save / update the reading record in IndexedDB.
      const after = useDivination.getState()
      if (after.readingId && after.spread) {
        const now = Date.now()
        const existing = after.turns
        const reading: Reading = {
          id: after.readingId,
          createdAt: existing[0]?.createdAt ?? now,
          updatedAt: now,
          question: after.question,
          spreadSnapshot: after.spread,
          drawn: after.drawn,
          reversedProbability: after.reversedProbability,
          turns: after.turns,
          modelUsed: `${config.provider}:${config.model}`,
        }
        void putReading(reading).catch(() => {})
      }
    },
    [],
  )

  const interpret = useCallback(() => void run('reading'), [run])
  const followUp = useCallback(
    (question: string, focusLabel?: string) => void run('followup', { question, focusLabel }),
    [run],
  )
  const cancel = useCallback(() => abortRef.current?.abort(), [])

  return { interpret, followUp, cancel }
}
