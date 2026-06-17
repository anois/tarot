import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLiveQuery } from 'dexie-react-hooks'
import clsx from 'clsx'
import { SpreadPreview } from '@/spreads/SpreadPreview'
import { BUILTIN_SPREADS } from '@/spreads/registry'
import { SPREAD_CATEGORIES, type SpreadCategory } from '@/spreads/categories'
import { listStoredSpreads } from '@/spreads/repo'
import { useDivination } from '../divination.store'
import type { Spread } from '@/spreads/types'

type Filter = SpreadCategory | 'all' | 'custom'

/**
 * In-flow spread picker: theme-category chips over a horizontal, snap-scrolling
 * rail of preview tiles. Tapping a tile is the single selection seam — it calls
 * setSpread() directly (which resets the flow). Shown only in the idle phase.
 */
export function SpreadCarousel() {
  const { t } = useTranslation()
  const current = useDivination((s) => s.spread)
  const majorOnly = useDivination((s) => s.majorOnly)
  const setSpread = useDivination((s) => s.setSpread)
  const stored = useLiveQuery(() => listStoredSpreads(), [], [])
  const [filter, setFilter] = useState<Filter>('all')

  const hasCustom = (stored?.length ?? 0) > 0
  const cats = SPREAD_CATEGORIES.filter((c) => BUILTIN_SPREADS.some((s) => s.category === c.id))
  const chips: { id: Filter; label: string; glyph?: string }[] = [
    { id: 'all', label: '全部' },
    ...cats.map((c) => ({ id: c.id as Filter, label: c.label, glyph: c.glyph })),
    ...(hasCustom ? [{ id: 'custom' as Filter, label: '自定义' }] : []),
  ]

  const items: { key: string; spread: Spread }[] = []
  if (filter !== 'custom') {
    for (const s of BUILTIN_SPREADS) {
      if (filter === 'all' || s.category === filter) items.push({ key: `b:${s.id}`, spread: s })
    }
  }
  if (filter === 'all' || filter === 'custom') {
    for (const ss of stored ?? []) items.push({ key: `s:${ss.uuid}`, spread: ss.spread })
  }

  return (
    <div className="animate-rise">
      {/* theme-category chips double as the section header */}
      <div className="no-scrollbar mb-2 flex gap-1.5 overflow-x-auto pb-0.5">
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setFilter(c.id)}
            className={clsx(
              'shrink-0 touch-manipulation rounded-full border px-3 py-1 text-xs transition-colors',
              filter === c.id
                ? 'border-gold-400 bg-gold-500/15 text-gold-200'
                : 'border-night-600/50 text-ink-400 hover:text-ink-200',
            )}
          >
            {c.glyph ? `${c.glyph} ${c.label}` : c.label}
          </button>
        ))}
      </div>
      <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
        {items.map(({ key, spread }) => {
          const active = current?.id === spread.id
          const blocked = majorOnly && spread.cardCount > 22
          return (
            <button
              key={key}
              type="button"
              disabled={blocked}
              onClick={() => setSpread(spread)}
              title={blocked ? t('reading.tooManyForMajor') : spread.name}
              className={clsx(
                'flex h-36 w-24 shrink-0 snap-start touch-manipulation flex-col rounded-2xl border p-1.5 text-left transition-colors',
                active
                  ? 'border-gold-400 bg-gold-500/10 ring-1 ring-gold-400/60'
                  : 'border-night-600/50 bg-night-800/50 hover:border-night-500',
                blocked && 'cursor-not-allowed opacity-40',
              )}
            >
              <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg">
                <SpreadPreview spread={spread} className="rounded-lg!" />
              </div>
              <div className="mt-1 truncate text-xs font-medium text-ink-100">{spread.name}</div>
              <div className="text-[11px] text-ink-500">
                {t('spreadsPage.cards', { n: spread.cardCount })}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
