import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { Button } from '@/ui/Button'
import { IconButton } from '@/ui/IconButton'
import type { Phase } from '../divination.store'

interface Props {
  phase: Phase
  pickedCount: number
  total: number
  canShuffle: boolean
  onShuffle: () => void
  onOpenControls: () => void
  onPrev: () => void
  onNext: () => void
  onPickThis: () => void
  onUndo: () => void
  onConfirm: () => void
  onReset: () => void
  onSkip: () => void
  onShare: () => void
}

export function ActionBar(p: Props) {
  const { t } = useTranslation()
  const full = p.pickedCount >= p.total && p.total > 0

  return (
    <div className="mt-3 rounded-2xl border border-night-600/50 bg-night-900/70 p-3 backdrop-blur">
      {p.phase === 'idle' && (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="md"
            className="shrink-0 border border-night-600/60"
            onClick={p.onOpenControls}
          >
            ⚙ {t('reading.options')}
          </Button>
          <Button
            size="lg"
            className="flex-1 animate-candle"
            onClick={p.onShuffle}
            disabled={!p.canShuffle}
          >
            {p.canShuffle ? t('reading.shuffle') : t('reading.needSpread')}
          </Button>
        </div>
      )}

      {p.phase === 'picking' && (
        <div className="flex flex-col gap-2.5">
          <Progress picked={p.pickedCount} total={p.total} />
          <div className="flex items-center gap-2">
            <IconButton variant="outline" onClick={p.onPrev} aria-label={t('reading.prev')}>
              ◀
            </IconButton>
            <Button
              size="lg"
              className="flex-1"
              onClick={p.onPickThis}
              disabled={full}
            >
              {t('reading.pickThis')}
            </Button>
            <IconButton variant="outline" onClick={p.onNext} aria-label={t('reading.next')}>
              ▶
            </IconButton>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={p.onUndo}
              disabled={p.pickedCount === 0}
            >
              {t('reading.undo')}
            </Button>
            <Button
              variant={full ? 'primary' : 'secondary'}
              size="sm"
              className="flex-1"
              onClick={p.onConfirm}
              disabled={!full}
            >
              {t('reading.confirm')}
            </Button>
            <Button variant="ghost" size="sm" className="flex-1" onClick={p.onReset}>
              {t('reading.reset')}
            </Button>
          </div>
        </div>
      )}

      {(p.phase === 'shuffling' || p.phase === 'revealing') && (
        <div className="flex items-center justify-center gap-3">
          <span className="animate-pulse text-sm text-gold-300">
            {p.phase === 'shuffling' ? t('reading.shuffling') : t('reading.revealing')}
          </span>
          <Button variant="ghost" size="sm" onClick={p.onSkip}>
            {t('reading.skip')} ⏭
          </Button>
        </div>
      )}

      {p.phase === 'done' && (
        <div className="flex items-center justify-center gap-2">
          <Button size="md" className="flex-1 sm:flex-none sm:px-8" onClick={p.onShare}>
            {t('reading.share')}
          </Button>
          <Button variant="secondary" size="md" className="flex-1 sm:flex-none sm:px-8" onClick={p.onReset}>
            {t('reading.reset')}
          </Button>
        </div>
      )}
    </div>
  )
}

function Progress({ picked, total }: { picked: number; total: number }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-3">
      {total <= 10 ? (
        <div className="flex flex-1 items-center gap-1.5">
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className={clsx(
                'h-2 w-2 rounded-full transition-colors',
                i < picked ? 'bg-gold-400' : 'bg-night-600',
              )}
            />
          ))}
        </div>
      ) : (
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-night-600">
          <div
            className="h-full rounded-full bg-gold-400 transition-all"
            style={{ width: `${total ? (picked / total) * 100 : 0}%` }}
          />
        </div>
      )}
      <span className="shrink-0 text-sm text-gold-300">
        {t('reading.pickHint', { count: picked, total })}
      </span>
    </div>
  )
}
