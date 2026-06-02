import type { CSSProperties, ReactNode } from 'react'
import clsx from 'clsx'
import type { Spread, SpreadPosition } from './types'
import { isSafeImageDataUrl } from '@/lib/image-sanitize'

interface SpreadPreviewProps {
  spread: Spread
  /** Custom renderer for the card at a position; defaults to a numbered slot. */
  renderCard?: (pos: SpreadPosition) => ReactNode
  className?: string
}

/**
 * Resolution-independent 2D layout renderer. Positions are normalized [0,1]
 * centers; this is the DOM analogue of the 3D `layoutToWorld` mapping and is the
 * single source of truth shared by the spreads list, the editor, and history.
 */
export function SpreadPreview({ spread, renderCard, className }: SpreadPreviewProps) {
  const aspectRatio = spread.aspectRatio ?? 1
  const bg = spread.background
  const bgUrl =
    bg && bg.type !== 'none' && bg.value && (bg.type === 'url' || isSafeImageDataUrl(bg.value))
      ? bg.value
      : undefined

  return (
    <div
      className={clsx(
        'relative w-full overflow-hidden rounded-xl border border-night-600/40 bg-night-900/60',
        className,
      )}
      style={{ aspectRatio: String(aspectRatio) }}
    >
      {bgUrl && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("${bgUrl}")`,
            backgroundSize: bg?.fit === 'fill' ? '100% 100%' : (bg?.fit ?? 'cover'),
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.5,
          }}
        />
      )}
      {spread.positions.map((p) => {
        const style: CSSProperties = {
          position: 'absolute',
          left: `${p.x * 100}%`,
          top: `${p.y * 100}%`,
          width: `${spread.card.widthRatio * 100}%`,
          height: `${spread.card.heightRatio * 100}%`,
          transform: `translate(-50%, -50%) rotate(${p.rotation}deg)`,
          zIndex: p.z,
        }
        return (
          <div key={p.id} style={style}>
            {renderCard ? renderCard(p) : <SlotCard position={p} />}
          </div>
        )
      })}
    </div>
  )
}

function SlotCard({ position }: { position: SpreadPosition }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center rounded-md border border-gold-500/50 bg-night-700/70 p-1 text-center shadow-md">
      <span className="font-display text-sm text-gold-300">{position.index}</span>
      <span className="mt-0.5 line-clamp-2 text-[10px] leading-tight text-ink-300">
        {position.label}
      </span>
    </div>
  )
}
