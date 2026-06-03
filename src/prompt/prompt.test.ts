import { describe, expect, it } from 'vitest'
import { buildReadingMessages, buildFollowupMessages, type ReadingContext } from './assemble'
import { getBuiltinSpread } from '@/spreads/registry'
import { getDeckCard } from '@/deck/deck'
import { getMeaningZh } from '@/deck/meaningsZh'
import type { DrawnCard } from '@/mechanics/types'

const spread = getBuiltinSpread('three-card')!
const drawn: DrawnCard[] = [
  { positionId: 'past', index: 1, cardId: 'major_00', reversed: false },
  { positionId: 'present', index: 2, cardId: 'major_13', reversed: true },
  { positionId: 'future', index: 3, cardId: 'cups_01', reversed: false },
]
const ctx: ReadingContext = { question: '我的事业会如何？', spread, drawn, template: 'structured' }

describe('buildReadingMessages', () => {
  const msgs = buildReadingMessages(ctx)
  const system = msgs[0].content
  const user = msgs[1].content

  it('starts with a system + user message', () => {
    expect(msgs).toHaveLength(2)
    expect(msgs[0].role).toBe('system')
    expect(msgs[1].role).toBe('user')
  })

  it('system enforces Chinese output and structured sections', () => {
    expect(system).toContain('简体中文')
    expect(system).toContain('逐张牌解读')
    expect(system).toContain('建议')
  })

  it('user block contains the question and every position label + meaning', () => {
    expect(user).toContain('我的事业会如何？')
    for (const p of spread.positions) {
      expect(user).toContain(p.label)
      expect(user).toContain(p.meaning)
    }
  })

  it('includes each card name with the correct orientation', () => {
    expect(user).toContain(getDeckCard('major_00')!.nameZh)
    expect(user).toMatch(/愚人[^\n]*正位/)
    expect(user).toMatch(/死神[^\n]*逆位/)
  })

  it('uses reversed meanings for the reversed card, not upright', () => {
    const death = getMeaningZh('major_13')!
    expect(user).toContain(death.reversed[0])
    // an upright-only phrase should not appear if distinct
    const uprightOnly = death.upright.find((u) => !death.reversed.includes(u))
    if (uprightOnly) expect(user).not.toContain(uprightOnly)
  })

  it('selects the system prompt by template', () => {
    expect(buildReadingMessages({ ...ctx, template: 'quick' })[0].content).toContain('简短速答')
    expect(buildReadingMessages({ ...ctx, template: 'narrative' })[0].content).toContain('故事化')
  })
})

describe('buildFollowupMessages', () => {
  const prior = [
    { role: 'reading' as const, template: 'structured' as const, content: '这是初次解读的内容。', createdAt: 1 },
  ]
  const msgs = buildFollowupMessages(ctx, prior, '这对我的财务具体意味着什么？', '现在')

  it('reuses the context and prior answer, then appends the follow-up question', () => {
    expect(msgs[0].content).toContain('深入追问')
    expect(msgs.some((m) => m.role === 'assistant' && m.content === '这是初次解读的内容。')).toBe(true)
    const last = msgs[msgs.length - 1]
    expect(last.role).toBe('user')
    expect(last.content).toContain('这对我的财务具体意味着什么？')
    expect(last.content).toContain('现在')
  })

  it('still carries the drawn cards as context (no re-draw)', () => {
    expect(msgs[1].content).toContain('死神')
    expect(msgs[0].content).toContain('不要重新洗牌')
  })
})
