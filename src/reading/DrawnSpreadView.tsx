import { SpreadPreview } from '@/spreads/SpreadPreview'
import { getCard } from '@/deck/cards'
import { cardImageUrl } from '@/deck/images'
import type { Spread } from '@/spreads/types'
import type { DrawnCard } from '@/mechanics/types'

/** Renders a spread with its drawn card faces (reversed cards rotated 180°). */
export function DrawnSpreadView({
  spread,
  drawn,
  className,
}: {
  spread: Spread
  drawn: DrawnCard[]
  className?: string
}) {
  const byPos = new Map(drawn.map((d) => [d.positionId, d]))
  return (
    <SpreadPreview
      spread={spread}
      className={className}
      renderCard={(pos) => {
        const d = byPos.get(pos.id)
        const card = d ? getCard(d.cardId) : undefined
        if (!d || !card) {
          return (
            <div className="flex h-full w-full items-center justify-center rounded-md border border-night-600 bg-night-700/60 text-[10px] text-ink-400">
              {pos.label}
            </div>
          )
        }
        return (
          <img
            src={cardImageUrl(card.imageKey)}
            alt={card.nameZh}
            title={`${pos.label} · ${card.nameZh}${d.reversed ? '（逆位）' : ''}`}
            className="h-full w-full rounded-md border border-gold-500/40 object-cover shadow-md"
            style={{ transform: d.reversed ? 'rotate(180deg)' : undefined }}
          />
        )
      }}
    />
  )
}
