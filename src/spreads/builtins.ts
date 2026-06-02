import type { Spread, SpreadPosition } from './types'

const SPEC = 'tarot-spread/1.0' as const
const round = (n: number) => Math.round(n * 1000) / 1000

function pos(
  id: string,
  index: number,
  label: string,
  x: number,
  y: number,
  meaning: string,
  rotation = 0,
  z = 0,
): SpreadPosition {
  return { id, index, label, x: round(x), y: round(y), rotation, z, meaning }
}

const single: Spread = {
  spec: SPEC,
  id: 'single',
  name: '单张指引',
  description: '抽一张牌，针对当下问题给出核心指引。',
  cardCount: 1,
  aspectRatio: 1,
  card: { widthRatio: 0.22, heightRatio: 0.38 },
  positions: [pos('card', 1, '指引', 0.5, 0.5, '针对你的问题的核心指引与当下能量。')],
}

const threeCard: Spread = {
  spec: SPEC,
  id: 'three-card',
  name: '三张牌（过去 / 现在 / 未来）',
  description: '经典三张牌时间线，可解读为过去-现在-未来、情境-行动-结果等。',
  cardCount: 3,
  aspectRatio: 1.8,
  card: { widthRatio: 0.22, heightRatio: 0.42 },
  positions: [
    pos('past', 1, '过去', 0.2, 0.5, '影响当前局面的过往根源。'),
    pos('present', 2, '现在', 0.5, 0.5, '此刻的核心处境与能量。'),
    pos('future', 3, '未来', 0.8, 0.5, '若延续当前方向的可能走向。'),
  ],
}

const celticCross: Spread = {
  spec: SPEC,
  id: 'celtic-cross',
  name: '凯尔特十字',
  description: '十张牌的综合牌阵：六张组成十字，四张组成右侧权杖。',
  cardCount: 10,
  aspectRatio: 1.35,
  card: { widthRatio: 0.12, heightRatio: 0.22 },
  positions: [
    pos('present', 1, '现状', 0.32, 0.5, '事情的核心、当前处境。'),
    pos('challenge', 2, '挑战', 0.32, 0.5, '横亘在你面前的阻碍或助力。', 90, 1),
    pos('foundation', 3, '根基', 0.32, 0.78, '事件的根源与潜在基础。'),
    pos('past', 4, '近过去', 0.17, 0.5, '正在离去的影响。'),
    pos('crown', 5, '顶冠', 0.32, 0.22, '你的目标或可能的最好结果。'),
    pos('future', 6, '近未来', 0.47, 0.5, '即将到来的影响。'),
    pos('self', 7, '自我', 0.72, 0.82, '你在此事中的态度与立场。'),
    pos('environment', 8, '环境', 0.72, 0.6, '他人与外部环境的影响。'),
    pos('hopes', 9, '希望与恐惧', 0.72, 0.38, '你内心的期待与担忧。'),
    pos('outcome', 10, '结果', 0.72, 0.16, '综合而言最可能的结局。'),
  ],
}

function buildHorseshoe(): SpreadPosition[] {
  const labels = ['过去', '现在', '隐藏影响', '障碍', '周遭/他人', '建议', '结果']
  const meanings = [
    '过往对当前的影响。',
    '当前的核心处境。',
    '尚未察觉的潜在因素。',
    '需要面对的障碍。',
    '周围的人或环境能量。',
    '可采取的最佳行动。',
    '最可能的结果。',
  ]
  return labels.map((label, k) => {
    const x = 0.12 + (k * 0.76) / 6
    const y = 0.22 + 0.5 * Math.sin((Math.PI * k) / 6)
    return pos(`h${k + 1}`, k + 1, label, x, y, meanings[k])
  })
}

const horseshoe: Spread = {
  spec: SPEC,
  id: 'horseshoe',
  name: '马蹄（七张）',
  description: '七张牌排成弧形，全面审视一个问题的来龙去脉。',
  cardCount: 7,
  aspectRatio: 1.7,
  card: { widthRatio: 0.12, heightRatio: 0.24 },
  positions: buildHorseshoe(),
}

const relationship: Spread = {
  spec: SPEC,
  id: 'relationship',
  name: '关系（五张）',
  description: '审视你与对方的关系：双方、连结、挑战与走向。',
  cardCount: 5,
  aspectRatio: 1.3,
  card: { widthRatio: 0.16, heightRatio: 0.3 },
  positions: [
    pos('you', 1, '你', 0.22, 0.5, '你在这段关系中的状态。'),
    pos('them', 2, '对方', 0.78, 0.5, '对方在这段关系中的状态。'),
    pos('bond', 3, '连结', 0.5, 0.5, '维系你们的核心连结。'),
    pos('challenge', 4, '挑战', 0.5, 0.8, '关系中需要面对的课题。'),
    pos('outcome', 5, '走向', 0.5, 0.2, '关系可能的发展方向。'),
  ],
}

function buildYearAhead(): SpreadPosition[] {
  const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
  const R = 0.4
  const monthPositions = months.map((label, k) => {
    const theta = (k * Math.PI) / 6 // 30deg steps, clockwise from top
    const x = 0.5 + R * Math.sin(theta)
    const y = 0.5 - R * Math.cos(theta)
    return pos(`m${k + 1}`, k + 1, label, x, y, `${label}的能量与主题。`)
  })
  monthPositions.push(pos('theme', 13, '全年主题', 0.5, 0.5, '贯穿全年的核心主题。'))
  return monthPositions
}

const yearAhead: Spread = {
  spec: SPEC,
  id: 'year-ahead',
  name: '年度之轮（十三张）',
  description: '十二个月围成一圈，外加一张全年主题，展望未来一年。',
  cardCount: 13,
  aspectRatio: 1,
  card: { widthRatio: 0.11, heightRatio: 0.2 },
  positions: buildYearAhead(),
}

export const BUILTIN_SPREADS: readonly Spread[] = [
  single,
  threeCard,
  relationship,
  horseshoe,
  celticCross,
  yearAhead,
]
