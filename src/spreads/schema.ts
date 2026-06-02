import { z } from 'zod'

export const SPREAD_SPEC_PREFIX = 'tarot-spread/1.'

const positionSchema = z.object({
  id: z.string().min(1),
  index: z.number().int().positive(),
  label: z.string().min(1),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  rotation: z.number(),
  z: z.number().int(),
  meaning: z.string().min(1),
  prompt: z.string().optional(),
})

const backgroundSchema = z.object({
  type: z.enum(['dataURL', 'url', 'none']),
  value: z.string().optional(),
  fit: z.enum(['cover', 'contain', 'fill']).optional(),
})

/** Zod schema for tarot-spread/1.x with structural rules AND cross-field invariants. */
export const spreadSchema = z
  .object({
    spec: z.string().refine((s) => s.startsWith(SPREAD_SPEC_PREFIX), {
      message: `spec 必须以 "${SPREAD_SPEC_PREFIX}" 开头`,
    }),
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    cardCount: z.number().int().positive(),
    aspectRatio: z.number().positive().optional(),
    defaultReversedProbability: z.number().min(0).max(1).optional(),
    background: backgroundSchema.optional(),
    card: z.object({
      widthRatio: z.number().positive().max(1),
      heightRatio: z.number().positive().max(1),
    }),
    positions: z.array(positionSchema).min(1),
  })
  .superRefine((data, ctx) => {
    if (data.cardCount !== data.positions.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['cardCount'],
        message: `cardCount (${data.cardCount}) 必须等于牌位数量 (${data.positions.length})`,
      })
    }

    const ids = new Set<string>()
    const indices = new Set<number>()
    data.positions.forEach((p, i) => {
      if (ids.has(p.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['positions', i, 'id'],
          message: `牌位 id 重复："${p.id}"`,
        })
      }
      ids.add(p.id)
      if (indices.has(p.index)) {
        ctx.addIssue({
          code: 'custom',
          path: ['positions', i, 'index'],
          message: `牌位 index 重复：${p.index}`,
        })
      }
      indices.add(p.index)
    })

    // indices must form exactly 1..N
    const n = data.positions.length
    for (let k = 1; k <= n; k++) {
      if (!indices.has(k)) {
        ctx.addIssue({
          code: 'custom',
          path: ['positions'],
          message: `牌位 index 必须为 1..${n} 的连续序列，缺少 ${k}`,
        })
        break
      }
    }

    if (data.background?.type === 'dataURL' && !data.background.value) {
      ctx.addIssue({
        code: 'custom',
        path: ['background', 'value'],
        message: 'background.type 为 dataURL 时必须提供 value',
      })
    }
  })

export type SpreadInput = z.input<typeof spreadSchema>
