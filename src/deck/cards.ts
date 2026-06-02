import type { Card, Rank, Suit } from './types'

/** Major Arcana 0..21 — canonical RWS English + Simplified Chinese names. */
const MAJOR_EN = [
  'The Fool',
  'The Magician',
  'The High Priestess',
  'The Empress',
  'The Emperor',
  'The Hierophant',
  'The Lovers',
  'The Chariot',
  'Strength',
  'The Hermit',
  'Wheel of Fortune',
  'Justice',
  'The Hanged Man',
  'Death',
  'Temperance',
  'The Devil',
  'The Tower',
  'The Star',
  'The Moon',
  'The Sun',
  'Judgement',
  'The World',
]
const MAJOR_ZH = [
  '愚人',
  '魔术师',
  '女祭司',
  '皇后',
  '皇帝',
  '教皇',
  '恋人',
  '战车',
  '力量',
  '隐士',
  '命运之轮',
  '正义',
  '倒吊人',
  '死神',
  '节制',
  '恶魔',
  '高塔',
  '星星',
  '月亮',
  '太阳',
  '审判',
  '世界',
]

export const SUITS: readonly Suit[] = ['wands', 'cups', 'swords', 'pentacles']
export const RANKS: readonly Rank[] = [
  '01',
  '02',
  '03',
  '04',
  '05',
  '06',
  '07',
  '08',
  '09',
  '10',
  'page',
  'knight',
  'queen',
  'king',
]

const SUIT_ZH: Record<Suit, string> = {
  wands: '权杖',
  cups: '圣杯',
  swords: '宝剑',
  pentacles: '星币',
}
const SUIT_EN: Record<Suit, string> = {
  wands: 'Wands',
  cups: 'Cups',
  swords: 'Swords',
  pentacles: 'Pentacles',
}
const RANK_ZH: Record<Rank, string> = {
  '01': '王牌',
  '02': '二',
  '03': '三',
  '04': '四',
  '05': '五',
  '06': '六',
  '07': '七',
  '08': '八',
  '09': '九',
  '10': '十',
  page: '侍从',
  knight: '骑士',
  queen: '王后',
  king: '国王',
}
const RANK_EN: Record<Rank, string> = {
  '01': 'Ace',
  '02': 'Two',
  '03': 'Three',
  '04': 'Four',
  '05': 'Five',
  '06': 'Six',
  '07': 'Seven',
  '08': 'Eight',
  '09': 'Nine',
  '10': 'Ten',
  page: 'Page',
  knight: 'Knight',
  queen: 'Queen',
  king: 'King',
}

function buildCards(): Card[] {
  const cards: Card[] = []
  for (let n = 0; n < 22; n++) {
    const id = `major_${String(n).padStart(2, '0')}`
    cards.push({
      id,
      arcana: 'major',
      majorNumber: n,
      nameEn: MAJOR_EN[n],
      nameZh: MAJOR_ZH[n],
      imageKey: id,
    })
  }
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      const id = `${suit}_${rank}`
      cards.push({
        id,
        arcana: 'minor',
        suit,
        rank,
        nameEn: `${RANK_EN[rank]} of ${SUIT_EN[suit]}`,
        nameZh: `${SUIT_ZH[suit]}${RANK_ZH[rank]}`,
        imageKey: id,
      })
    }
  }
  return cards
}

/** The full 78-card deck identity (22 Major + 4×14 Minor). */
export const CARDS: readonly Card[] = buildCards()

export const CARD_BY_ID: ReadonlyMap<string, Card> = new Map(CARDS.map((c) => [c.id, c]))

export function getCard(id: string): Card | undefined {
  return CARD_BY_ID.get(id)
}
