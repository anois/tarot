/** Theme buckets for organizing spreads (love / career / wealth / …). */
export type SpreadCategory =
  | 'general'
  | 'love'
  | 'career'
  | 'wealth'
  | 'decision'
  | 'spiritual'

export interface CategoryMeta {
  id: SpreadCategory
  label: string
  glyph: string
}

/** Display order of the theme categories. */
export const SPREAD_CATEGORIES: readonly CategoryMeta[] = [
  { id: 'general', label: '综合指引', glyph: '✦' },
  { id: 'love', label: '感情桃花', glyph: '♡' },
  { id: 'career', label: '事业', glyph: '⚑' },
  { id: 'wealth', label: '财运', glyph: '¥' },
  { id: 'decision', label: '抉择', glyph: '⚖' },
  { id: 'spiritual', label: '身心灵', glyph: '✷' },
]

export const CATEGORY_LABEL = Object.fromEntries(
  SPREAD_CATEGORIES.map((c) => [c.id, c.label]),
) as Record<SpreadCategory, string>
