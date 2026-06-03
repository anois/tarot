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
  opts: { rotation?: number; z?: number; prompt?: string } = {},
): SpreadPosition {
  const { rotation = 0, z = 0, prompt } = opts
  return { id, index, label, x: round(x), y: round(y), rotation, z, meaning, ...(prompt ? { prompt } : {}) }
}

/* ── radial / column layout helpers (shared by wheel & column spreads) ──── */
function ring(k: number, n: number, r: number): [number, number] {
  const theta = (k * 2 * Math.PI) / n // clockwise from top
  return [0.5 + r * Math.sin(theta), 0.5 - r * Math.cos(theta)]
}
function column(k: number, n: number, top = 0.07, bottom = 0.93): number {
  return top + (k * (bottom - top)) / (n - 1)
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

const decision: Spread = {
  spec: SPEC,
  id: 'decision',
  name: '二选一抉择',
  description: '在两个具体选项之间做决定，分别揭示各选项的走向。',
  cardCount: 2,
  aspectRatio: 1.6,
  card: { widthRatio: 0.3, heightRatio: 0.56 },
  positions: [
    pos('a', 1, '选择 A', 0.3, 0.5, '选择 A 这条路径的走向、机遇与代价。', {
      prompt: '请围绕选择 A 解读 {card}，揭示这条路径可能带来的发展、机遇与需要权衡的代价。',
    }),
    pos('b', 2, '选择 B', 0.7, 0.5, '选择 B 这条路径的走向、机遇与代价。', {
      prompt: '请围绕选择 B 解读 {card}，揭示这条路径可能带来的发展、机遇与需要权衡的代价。',
    }),
  ],
}

const yesNoClarifier: Spread = {
  spec: SPEC,
  id: 'yes-no-clarifier',
  name: '是非澄清·两张',
  description: '针对一个是非题给出倾向性答案，并以第二张澄清其背景。',
  cardCount: 2,
  aspectRatio: 1.3,
  card: { widthRatio: 0.3, heightRatio: 0.34 },
  positions: [
    pos('answer', 1, '答案', 0.5, 0.33, '针对该是非题的总体倾向与核心回应。', {
      prompt: '依据 {card} 判断此问题更偏向「是」还是「否」，说明倾向强弱与理由。',
    }),
    pos('clarifier', 2, '澄清', 0.5, 0.67, '答案背后的关键背景、条件与注意要点。', {
      prompt: '结合 {card} 阐释答案的成立前提与背景因素，指出需留意的条件。',
    }),
  ],
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

const situationActionOutcome: Spread = {
  spec: SPEC,
  id: 'situation-action-outcome',
  name: '情境·行动·结果',
  description: '针对一个处境，看清现状、应采取的行动、以及可能的结果。',
  cardCount: 3,
  aspectRatio: 1.8,
  card: { widthRatio: 0.22, heightRatio: 0.42 },
  positions: [
    pos('situation', 1, '情境', 0.2, 0.5, '当前处境的核心现状与主要能量。', {
      prompt: '请说明 {card} 如何揭示此处境的现状、关键症结与潜在主题。',
    }),
    pos('action', 2, '行动', 0.5, 0.5, '此刻最值得采取的态度与具体行动。', {
      prompt: '请基于 {card} 给出可落地的行动建议，说明应聚焦或调整之处。',
    }),
    pos('outcome', 3, '结果', 0.8, 0.5, '延续当前方向后可能出现的走向。', {
      prompt: '请解读 {card} 指向的可能结果，并指出其依据与可影响的变量。',
    }),
  ],
}

const mindBodySpirit: Spread = {
  spec: SPEC,
  id: 'mind-body-spirit',
  name: '身·心·灵',
  description: '从心智、身体、灵性三个层面审视当下的整体状态。',
  cardCount: 3,
  aspectRatio: 0.72,
  card: { widthRatio: 0.18, heightRatio: 0.22 },
  positions: [
    pos('mind', 1, '心智', 0.5, 0.22, '你当前的思维、情绪与心理状态。', {
      prompt: '请就「心智」层面，解读 {card} 揭示的当下心态与思绪重心。',
    }),
    pos('body', 2, '身体', 0.5, 0.5, '你身体的能量、需求与现实处境。', {
      prompt: '请就「身体」层面，解读 {card} 反映的精力状态与现实需要。',
    }),
    pos('spirit', 3, '灵性', 0.5, 0.78, '你内在的信念、连结与精神追求。', {
      prompt: '请就「灵性」层面，解读 {card} 指向的内在信念与精神方向。',
    }),
  ],
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

function buildPentagram(): SpreadPosition[] {
  const items: Array<[string, string, string, string]> = [
    ['core', '灵性核心', '议题对你的深层意义与价值取向。', '请说明 {card} 如何映射此议题的灵性核心与内在意义。'],
    ['emotion', '情感', '你在此议题上的情绪流动与内心感受。', '请围绕 {card} 解读你在此议题中的情感状态与需求。'],
    ['body', '身体', '议题落在现实层面的身体与物质表现。', '请借助 {card} 分析此议题在身体与现实层面的呈现。'],
    ['thought', '思想', '你对此议题的认知、想法与思考方式。', '请通过 {card} 阐述你在此议题上的思维模式与观念。'],
    ['will', '意志', '你推动此议题的动力、决心与行动倾向。', '请结合 {card} 解读你在此议题上的意志与行动方向。'],
  ]
  return items.map(([id, label, meaning, prompt], k) => {
    const [x, y] = ring(k, 5, 0.4)
    return pos(id, k + 1, label, x, y, meaning, { prompt })
  })
}

const pentagram: Spread = {
  spec: SPEC,
  id: 'pentagram',
  name: '五芒星',
  description: '以五芒星五个顶点审视一个议题的灵性、情感、身体、思想与意志面向。',
  cardCount: 5,
  aspectRatio: 1,
  card: { widthRatio: 0.16, heightRatio: 0.28 },
  positions: buildPentagram(),
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

function buildChakra(): SpreadPosition[] {
  const items: Array<[string, string, string, string]> = [
    ['crown', '顶轮', '你与更高意义、灵性与整体性的连结状态。', '结合 {card}，说明此刻你与意义感、信念及超越自我的连结，可如何敞开。'],
    ['brow', '眉心轮', '你的直觉、洞察与看清全局的内在视野。', '依据 {card}，描述你的直觉与判断如何运作，哪些洞见正等待被看见。'],
    ['throat', '喉轮', '你的表达、真诚沟通与说出真实的能力。', '围绕 {card}，谈谈你在表达与倾听上的状态，如何更真诚地说出所想。'],
    ['heart', '心轮', '你的爱、慈悲与给予和接纳之间的平衡。', '结合 {card}，探讨你在爱、连结与自我接纳上的开放程度与课题。'],
    ['solar', '太阳轮', '你的自我意志、行动力与个人界限。', '依据 {card}，分析你的自信、主导力与界限设定，如何更稳定地发挥意志。'],
    ['sacral', '生殖轮', '你的情感流动、创造力与亲密关系活力。', '围绕 {card}，描述你的情感、欲望与创造能量如何流动，能怎样滋养它。'],
    ['root', '海底轮', '你的安全感、根基与现实层面的稳定。', '结合 {card}，说明你在安全感、归属与生存根基上的状态及可加固之处。'],
  ]
  return items.map(([id, label, meaning, prompt], k) =>
    pos(id, k + 1, label, 0.5, column(k, 7), meaning, { prompt }),
  )
}

const chakra: Spread = {
  spec: SPEC,
  id: 'chakra',
  name: '七脉轮',
  description: '沿七个脉轮自顶至底审视能量与身心议题。',
  cardCount: 7,
  aspectRatio: 0.42,
  card: { widthRatio: 0.18, heightRatio: 0.13 },
  positions: buildChakra(),
}

const relationshipCross: Spread = {
  spec: SPEC,
  id: 'relationship-cross',
  name: '关系十字·七张',
  description: '以十字布局深入审视两人关系的现状、彼此期待、课题与走向。',
  cardCount: 7,
  aspectRatio: 1.3,
  card: { widthRatio: 0.15, heightRatio: 0.26 },
  positions: [
    pos('you', 1, '你', 0.22, 0.5, '你在这段关系中的真实状态与心境。', {
      prompt: '结合 {card}，描述你当下在这段关系里的状态、情绪与投入方式。',
    }),
    pos('them', 2, '对方', 0.78, 0.5, '对方在这段关系中的状态与心境。', {
      prompt: '结合 {card}，刻画对方此刻在关系中的状态、姿态与可能的内在动因。',
    }),
    pos('now', 3, '关系现状', 0.5, 0.5, '你们之间当下的互动氛围与连结实质。', {
      prompt: '结合 {card}，解读你们眼下相处的氛围、连结强度与互动模式。',
    }),
    pos('your-hope', 4, '你的期待', 0.22, 0.18, '你对这段关系隐含或明确的渴望。', {
      prompt: '结合 {card}，揭示你内心对这段关系真正期待与渴望得到什么。',
    }),
    pos('their-hope', 5, '对方的期待', 0.78, 0.18, '对方对这段关系的需求与盼望。', {
      prompt: '结合 {card}，推敲对方在关系中希望获得或维系的需求。',
    }),
    pos('lesson', 6, '课题', 0.5, 0.82, '关系中需共同面对与化解的功课。', {
      prompt: '结合 {card}，点明这段关系当前的核心课题及双方可着力之处。',
    }),
    pos('trend', 7, '走向', 0.5, 0.16, '若延续当前方向关系的可能发展。', {
      prompt: '结合 {card}，描绘关系在现有趋势下的可能走向，并给出中性提醒。',
    }),
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
    pos('challenge', 2, '挑战', 0.32, 0.5, '横亘在你面前的阻碍或助力。', { rotation: 90, z: 1 }),
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

function buildZodiac(): SpreadPosition[] {
  const items: Array<[string, string, string, string]> = [
    ['h1', '第一宫·自我', '你的外在形象、行事风格与当前的自我状态。', '请围绕自我呈现与个人风格，解读 {card} 揭示的当前状态与可调整之处。'],
    ['h2', '第二宫·财富', '金钱、资源与你看重的价值及安全感。', '请就收入、资源与价值观，分析 {card} 对财务态度与积累方式的提示。'],
    ['h3', '第三宫·沟通', '表达、学习、日常往来与思维方式。', '请从沟通表达与学习交流角度，说明 {card} 对信息传递与近身关系的启发。'],
    ['h4', '第四宫·家庭', '家庭、根基、居所与内在归属感。', '请围绕家庭根基与情感归属，解读 {card} 所映照的安稳来源与需要照料之处。'],
    ['h5', '第五宫·创造', '创造力、恋爱、娱乐与自我表达的快乐。', '请就创意表达与情趣享受，分析 {card} 如何点亮你的热情与自我展现。'],
    ['h6', '第六宫·健康', '身心健康、日常节律与工作责任。', '请从健康作息与日常事务角度，说明 {card} 对身心平衡与效率的建议。'],
    ['h7', '第七宫·伴侣', '亲密伴侣、合作关系与一对一的互动。', '请围绕伴侣与合作关系，解读 {card} 揭示的相处模式与需要协调之处。'],
    ['h8', '第八宫·转化', '深层蜕变、共享资源与放下与重生。', '请就转化、共享资源与心理深处，分析 {card} 指向的蜕变契机与可松开的执着。'],
    ['h9', '第九宫·信念', '信念体系、远行、求知与人生意义。', '请从信念视野与求知探索角度，说明 {card} 如何拓展你的眼界与意义感。'],
    ['h10', '第十宫·事业', '事业方向、社会声誉与长远目标。', '请围绕事业成就与公众形象，解读 {card} 对发展方向与责任承担的指引。'],
    ['h11', '第十一宫·社群', '朋友、社群、愿景与共同理想。', '请就友群网络与未来愿景，分析 {card} 对人脉协作与理想实现的启发。'],
    ['h12', '第十二宫·潜意识', '潜意识、独处、隐秘课题与内在疗愈。', '请从潜意识与隐微课题角度，说明 {card} 揭示的内在情绪与可疗愈的部分。'],
  ]
  return items.map(([id, label, meaning, prompt], k) => {
    const [x, y] = ring(k, 12, 0.42)
    return pos(id, k + 1, label, x, y, meaning, { prompt })
  })
}

const zodiacHouses: Spread = {
  spec: SPEC,
  id: 'zodiac-houses',
  name: '星象十二宫',
  description: '占星十二宫轮盘，逐宫审视自我、财富、关系、事业等人生各领域。',
  cardCount: 12,
  aspectRatio: 1,
  card: { widthRatio: 0.11, heightRatio: 0.2 },
  positions: buildZodiac(),
}

function buildYearAhead(): SpreadPosition[] {
  const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
  const monthPositions = months.map((label, k) => {
    const [x, y] = ring(k, 12, 0.4)
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
  decision,
  yesNoClarifier,
  threeCard,
  situationActionOutcome,
  mindBodySpirit,
  relationship,
  pentagram,
  horseshoe,
  chakra,
  relationshipCross,
  celticCross,
  zodiacHouses,
  yearAhead,
]
