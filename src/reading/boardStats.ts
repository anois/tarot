import type { DrawnCard } from '@/mechanics/types'
import type { Suit } from '@/deck/types'
import { getCard } from '@/deck/cards'
import { elementOf, type Element } from '@/deck/correspondences'

export interface BoardStats {
  total: number
  upright: number
  reversed: number
  major: number
  minor: number
  court: number
  elements: Record<Element, number>
  suits: Record<Suit, number>
  /** Human-readable Chinese feature lines describing the overall pattern. */
  features: string[]
}

const ELEMENT_HINT: Record<Element, string> = {
  火: '行动力、热情与意志旺盛',
  水: '情感、关系与直觉浓厚',
  风: '思辨、沟通与抉择突出',
  土: '务实、物质与稳定为重',
}

const COURTS = ['page', 'knight', 'queen', 'king']

export function computeBoardStats(drawn: DrawnCard[]): BoardStats {
  const elements: Record<Element, number> = { 火: 0, 水: 0, 风: 0, 土: 0 }
  const suits: Record<Suit, number> = { wands: 0, cups: 0, swords: 0, pentacles: 0 }
  let upright = 0
  let reversed = 0
  let major = 0
  let minor = 0
  let court = 0

  for (const d of drawn) {
    const card = getCard(d.cardId)
    if (!card) continue
    if (d.reversed) reversed++
    else upright++
    elements[elementOf(card)]++
    if (card.arcana === 'major') major++
    else {
      minor++
      if (card.suit) suits[card.suit]++
      if (card.rank && COURTS.includes(card.rank)) court++
    }
  }

  const total = drawn.length
  const features: string[] = []

  // upright / reversed balance
  if (total > 0) {
    if (reversed === 0) features.push('全部正位：能量顺畅、向外显化')
    else if (upright === 0) features.push('全部逆位：能量普遍受阻、转向内在或需要调整')
    else if (reversed / total >= 0.6) features.push(`逆位偏多（${reversed}/${total}）：阻滞、延迟或向内收敛的主题明显`)
    else if (upright / total >= 0.6) features.push(`正位居多（${upright}/${total}）：能量较为顺畅、积极展开`)
    else features.push('正逆位大致均衡：顺流与阻力并存')
  }

  // major arcana density
  if (total >= 2) {
    if (major / total >= 0.5) features.push(`大阿卡纳占多数（${major}/${total}）：事关重大命运转折与人生课题，非日常琐事可左右`)
    else if (major === 0) features.push('全为小阿卡纳：聚焦在可把握的日常与具体事务')
    else if (major >= 1) features.push(`含 ${major} 张大阿卡纳：在日常之中夹带着更深的命运推动`)
  }

  // dominant element
  if (total > 0) {
    const sorted = (Object.entries(elements) as [Element, number][]).sort((a, b) => b[1] - a[1])
    const [topEl, topN] = sorted[0]
    if (topN >= Math.ceil(total * 0.5) && topN >= 2) {
      features.push(`${topEl}元素偏重（${topN}/${total}）：${ELEMENT_HINT[topEl]}`)
    } else if (sorted.filter(([, n]) => n > 0).length >= 3) {
      features.push('多元素交织：局面层面丰富、需要综合权衡')
    }
    const absent = (Object.entries(elements) as [Element, number][]).filter(([, n]) => n === 0).map(([e]) => e)
    if (total >= 3 && absent.length === 1) features.push(`缺少${absent[0]}元素：该层面（${ELEMENT_HINT[absent[0]]}）相对薄弱或被忽略`)
  }

  // court cards
  if (court >= 2) features.push(`宫廷牌较多（${court} 张）：他人、性格或具体人物的影响显著`)

  return { total, upright, reversed, major, minor, court, elements, suits, features }
}
