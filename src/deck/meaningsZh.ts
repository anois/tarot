import cardMeaningsZh from './data/card-meanings-zh.json'

/** Simplified-Chinese keywords + upright/reversed meanings (curated, all-Chinese). */
export interface MeaningZh {
  keywords: string[]
  upright: string[]
  reversed: string[]
}

const DATA = cardMeaningsZh as Record<string, MeaningZh>

export function getMeaningZh(id: string): MeaningZh | undefined {
  return DATA[id]
}
