import { useTranslation } from 'react-i18next'
import { useLiveQuery } from 'dexie-react-hooks'
import clsx from 'clsx'
import { SpreadPreview } from '@/spreads/SpreadPreview'
import { BUILTIN_SPREADS } from '@/spreads/registry'
import { listStoredSpreads } from '@/spreads/repo'
import { useDivination } from '../divination.store'
import type { Spread } from '@/spreads/types'

/**
 * In-flow spread picker: a horizontal, snap-scrolling rail of preview tiles.
 * Tapping a tile is the single selection seam — it calls setSpread() directly
 * (which resets the flow). Shown only in the idle phase.
 */
export function SpreadCarousel() {
  const { t } = useTranslation()
  const current = useDivination((s) => s.spread)
  const majorOnly = useDivination((s) => s.majorOnly)
  const setSpread = useDivination((s) => s.setSpread)
  const stored = useLiveQuery(() => listStoredSpreads(), [], [])

  const items: { key: string; spread: Spread }[] = [
    ...BUILTIN_SPREADS.map((s) => ({ key: `b:${s.id}`, spread: s })),
    ...(stored ?? []).map((ss) => ({ key: `s:${ss.uuid}`, spread: ss.spread })),
  ]

  return (
    <div className="animate-rise">
      <div className="mb-2 flex items-baseline justify-between px-1">
        <span className="text-sm text-ink-300">{t('reading.pickSpread')}</span>
        <span className="text-xs text-ink-500">{t('reading.carouselHint')}</span>
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
