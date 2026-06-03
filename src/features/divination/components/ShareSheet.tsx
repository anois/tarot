import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { Sheet } from '@/ui/Sheet'
import { Button } from '@/ui/Button'
import { useDivination } from '../divination.store'
import { composeShareImage, type ShareStyle } from '@/features/share/shareImage'

export function ShareSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const spread = useDivination((s) => s.spread)
  const drawn = useDivination((s) => s.drawn)
  const question = useDivination((s) => s.question)
  const turns = useDivination((s) => s.turns)

  const hasInterp = turns.some((tn) => tn.role === 'reading')
  const [style, setStyle] = useState<ShareStyle>('spread')
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const effectiveStyle: ShareStyle = hasInterp ? style : 'spread'

  // (Re)generate the image whenever the sheet opens or the chosen style
  // changes. This is genuine async rendering tied to props (open/style), so the
  // setState-in-effect rule is intentionally relaxed for this one effect.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open || !spread || drawn.length === 0) return
    let alive = true
    setBusy(true)
    setDataUrl(null)
    composeShareImage({ spread, drawn, question, turns, style: effectiveStyle })
      .then((url) => {
        if (alive) {
          setDataUrl(url)
          setBusy(false)
        }
      })
      .catch(() => {
        if (alive) setBusy(false)
      })
    return () => {
      alive = false
    }
  }, [open, effectiveStyle, spread, drawn, question, turns])
  /* eslint-enable react-hooks/set-state-in-effect */

  function download() {
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `tarot-${spread?.id ?? 'reading'}-${Date.now()}.png`
    a.click()
  }

  async function shareImg() {
    if (!dataUrl) return
    try {
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], 'tarot.png', { type: 'image/png' })
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
      if (nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: t('share.title') })
        return
      }
    } catch {
      /* fall through to download */
    }
    download()
  }

  const canShareFiles =
    typeof navigator !== 'undefined' &&
    'canShare' in navigator &&
    typeof (navigator as Navigator & { canShare?: unknown }).canShare === 'function'

  return (
    <Sheet open={open} onClose={onClose} title={t('share.title')}>
      <div className="flex flex-col gap-4">
        {/* style chooser */}
        <div className="flex gap-2">
          <StyleChip active={effectiveStyle === 'spread'} onClick={() => setStyle('spread')}>
            {t('share.styleSpread')}
          </StyleChip>
          <StyleChip
            active={effectiveStyle === 'full'}
            disabled={!hasInterp}
            onClick={() => setStyle('full')}
          >
            {t('share.styleFull')}
          </StyleChip>
        </div>
        {!hasInterp && <p className="-mt-2 text-xs text-ink-500">{t('share.needInterp')}</p>}

        {/* preview */}
        <div className="flex min-h-64 items-center justify-center overflow-hidden rounded-2xl border border-night-600/50 bg-night-950/50 p-3">
          {dataUrl ? (
            <img
              src={dataUrl}
              alt={t('share.title')}
              className="max-h-[58svh] w-auto rounded-lg shadow-2xl"
            />
          ) : (
            <span className="animate-pulse py-12 text-sm text-gold-300">
              {busy ? t('share.generating') : t('common.loading')}
            </span>
          )}
        </div>
        <p className="text-center text-xs text-ink-500">{t('share.qrHint')}</p>
      </div>

      <div className="mt-4 flex gap-2">
        <Button className="flex-1" disabled={!dataUrl} onClick={download}>
          {t('share.download')}
        </Button>
        {canShareFiles && (
          <Button variant="secondary" className="flex-1" disabled={!dataUrl} onClick={shareImg}>
            {t('share.shareBtn')}
          </Button>
        )}
      </div>
    </Sheet>
  )
}

function StyleChip({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        'min-h-10 flex-1 touch-manipulation rounded-xl border px-3 text-sm transition-colors',
        active
          ? 'border-gold-400 bg-gold-500/15 text-gold-200'
          : 'border-night-600/60 text-ink-300 hover:text-ink-100',
        disabled && 'cursor-not-allowed opacity-40',
      )}
    >
      {children}
    </button>
  )
}
