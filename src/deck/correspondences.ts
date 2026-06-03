import type { Card, Suit } from './types'
import cardLore from './data/card-lore.json'

export type Element = '火' | '水' | '风' | '土'

const SUIT_ELEMENT: Record<Suit, Element> = { wands: '火', cups: '水', swords: '风', pentacles: '土' }

// Golden Dawn decanic attributions: each suit's pips 2..10 span three zodiac
// signs (3 cards each) ruled by a planet. Index 0..8 = ranks 2..10.
const SUIT_ZODIACS: Record<Suit, [string, string, string]> = {
  wands: ['白羊座', '狮子座', '射手座'],
  cups: ['巨蟹座', '天蝎座', '双鱼座'],
  swords: ['天秤座', '水瓶座', '双子座'],
  pentacles: ['摩羯座', '金牛座', '处女座'],
}
const DECAN_RULER: Record<Suit, string[]> = {
  wands: ['火星', '太阳', '金星', '土星', '木星', '火星', '水星', '月亮', '土星'],
  cups: ['金星', '水星', '月亮', '火星', '太阳', '金星', '土星', '木星', '火星'],
  swords: ['月亮', '土星', '木星', '金星', '水星', '月亮', '木星', '火星', '太阳'],
  pentacles: ['木星', '火星', '太阳', '水星', '月亮', '土星', '太阳', '金星', '水星'],
}

// Major Arcana — standard RWS / Golden Dawn celestial attributions.
const MAJOR_ASTRO = [
  '风元素 · 天王星', '水星', '月亮', '金星', '白羊座', '金牛座', '双子座', '巨蟹座',
  '狮子座', '处女座', '木星', '天秤座', '水元素 · 海王星', '天蝎座', '射手座', '摩羯座',
  '火星', '水瓶座', '双鱼座', '太阳', '火元素 · 冥王星', '土星',
]
const MAJOR_ELEMENT: Element[] = [
  '风', '风', '水', '土', '火', '土', '风', '水', '火', '土', '火', '风',
  '水', '水', '火', '土', '火', '风', '水', '火', '火', '土',
]

const COURT_ROLE: Record<string, string> = {
  page: '侍从 · 学习与讯息',
  knight: '骑士 · 行动与追寻',
  queen: '王后 · 涵容与滋养',
  king: '国王 · 掌控与决断',
}
const NUM_THEME: Record<string, string> = {
  '01': '一 · 纯粹的起点与潜能',
  '02': '二 · 平衡与抉择',
  '03': '三 · 成长与协作',
  '04': '四 · 稳定与根基',
  '05': '五 · 冲突与变动',
  '06': '六 · 和谐与给予',
  '07': '七 · 考验与坚持',
  '08': '八 · 精进与力量',
  '09': '九 · 临近圆满',
  '10': '十 · 完成与循环',
  page: '宫廷 · 见习者',
  knight: '宫廷 · 行动者',
  queen: '宫廷 · 王后',
  king: '宫廷 · 国王',
}

export interface CardDetail {
  element: Element
  astrology: string
  numerology: string
  symbolism: string
  story: string
}

const LORE = cardLore as Record<string, { symbolism?: string; story?: string }>

export function elementOf(card: Card): Element {
  return card.arcana === 'major' ? MAJOR_ELEMENT[card.majorNumber ?? 0] : SUIT_ELEMENT[card.suit!]
}

export function getCardDetail(card: Card): CardDetail {
  let astrology: string
  let numerology: string
  if (card.arcana === 'major') {
    const n = card.majorNumber ?? 0
    astrology = MAJOR_ASTRO[n]
    numerology = `${n} · 大阿卡纳`
  } else {
    const suit = card.suit!
    const rank = card.rank!
    const el = SUIT_ELEMENT[suit]
    if (rank === '01') astrology = `${el}元素之根`
    else if (rank in COURT_ROLE) astrology = `${el}元素 · ${COURT_ROLE[rank].split(' · ')[0]}`
    else {
      const idx = Number(rank) - 2
      astrology = `${DECAN_RULER[suit][idx]} · ${SUIT_ZODIACS[suit][Math.floor(idx / 3)]}`
    }
    numerology = NUM_THEME[rank]
  }
  const lore = LORE[card.id] ?? {}
  return {
    element: elementOf(card),
    astrology,
    numerology,
    symbolism: lore.symbolism ?? '',
    story: lore.story ?? '',
  }
}
