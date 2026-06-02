import { z } from 'zod'
import { spreadSchema } from '@/spreads/schema'
import type { Reading } from './types'

const drawnSchema = z.object({
  positionId: z.string(),
  index: z.number().int(),
  cardId: z.string(),
  reversed: z.boolean(),
})

const turnSchema = z.object({
  role: z.enum(['reading', 'followup']),
  template: z.enum(['structured', 'narrative', 'quick', 'deepdive']),
  question: z.string().optional(),
  focusPositionId: z.string().optional(),
  content: z.string(),
  createdAt: z.number(),
})

const readingSchema = z.object({
  id: z.string().min(1),
  createdAt: z.number(),
  updatedAt: z.number(),
  question: z.string(),
  spreadSnapshot: spreadSchema,
  drawn: z.array(drawnSchema),
  reversedProbability: z.number().min(0).max(1),
  turns: z.array(turnSchema),
  modelUsed: z.string(),
})

export const readingEnvelopeSchema = z.object({
  spec: z.string().refine((s) => s.startsWith('tarot-reading/1.'), {
    message: 'spec 必须以 "tarot-reading/1." 开头',
  }),
  exportedAt: z.string().optional(),
  app: z.object({ name: z.string(), version: z.string() }).optional(),
  reading: readingSchema,
})

const APP_VERSION = '0.1.0'

export function buildEnvelope(reading: Reading, isoNow: string): string {
  return JSON.stringify(
    {
      spec: 'tarot-reading/1.0',
      exportedAt: isoNow,
      app: { name: 'tarot', version: APP_VERSION },
      reading,
    },
    null,
    2,
  )
}

export function downloadReading(reading: Reading): void {
  const isoNow = new Date(reading.updatedAt).toISOString()
  const blob = new Blob([buildEnvelope(reading, isoNow)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `reading-${isoNow.slice(0, 10)}.tarot.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export type ReadingParseResult =
  | { ok: true; reading: Reading }
  | { ok: false; message: string }

export function parseReadingEnvelope(text: string): ReadingParseResult {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch (e) {
    return { ok: false, message: `JSON 解析失败：${(e as Error).message}` }
  }
  const r = readingEnvelopeSchema.safeParse(data)
  if (!r.success) {
    const first = r.error.issues[0]
    return { ok: false, message: `${first.path.join('.') || '(root)'}: ${first.message}` }
  }
  return { ok: true, reading: r.data.reading as Reading }
}

export async function importReadingFromFile(file: File): Promise<ReadingParseResult> {
  return parseReadingEnvelope(await file.text())
}
