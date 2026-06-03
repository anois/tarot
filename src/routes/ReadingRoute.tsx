import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { ErrorBoundary } from '@/ui/ErrorBoundary'
import { Scene } from '@/features/deck3d/Scene'
import { useDivination } from '@/features/divination/divination.store'
import { useInterpret } from '@/features/divination/useInterpret'
import { InterpretationPanel } from '@/features/divination/components/InterpretationPanel'
import { CardDetailPanel } from '@/features/divination/components/CardDetailPanel'
import { SpreadCarousel } from '@/features/divination/components/SpreadCarousel'
import { ControlsSheet } from '@/features/divination/components/ControlsSheet'
import { ShareSheet } from '@/features/divination/components/ShareSheet'
import { ActionBar } from '@/features/divination/components/ActionBar'
import { getBuiltinSpread } from '@/spreads/registry'
import { getCard } from '@/deck/cards'
import type { Spread } from '@/spreads/types'

export default function ReadingRoute() {
  const { t } = useTranslation()
  const [controlsOpen, setControlsOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  const phase = useDivination((s) => s.phase)
  const spread = useDivination((s) => s.spread)
  const question = useDivination((s) => s.question)
  const picked = useDivination((s) => s.picked)
  const drawn = useDivination((s) => s.drawn)
  const majorOnly = useDivination((s) => s.majorOnly)
  const setSpread = useDivination((s) => s.setSpread)
  const startShuffle = useDivination((s) => s.startShuffle)
  const undoLast = useDivination((s) => s.undoLast)
  const confirm = useDivination((s) => s.confirm)
  const reset = useDivination((s) => s.reset)
  const stepCentered = useDivination((s) => s.stepCentered)
  const pickCentered = useDivination((s) => s.pickCentered)
  const finishShuffle = useDivination((s) => s.finishShuffle)
  const finishReveal = useDivination((s) => s.finishReveal)
  const { interpret, followUp, cancel } = useInterpret()

  // Default the active spread on first mount if nothing is selected yet
  // (e.g. arriving fresh, not via the spreads library). setSpread is a store
  // action, not React state, so this is safe under react-hooks rules.
  useEffect(() => {
    if (!useDivination.getState().spread) {
      const def = getBuiltinSpread('three-card')
      if (def) setSpread(def)
    }
  }, [setSpread])

  const tooManyForMajor = majorOnly && !!spread && spread.cardCount > 22
  const canShuffle = !!spread && !tooManyForMajor

  return (
    <div className="flex flex-col">
      {/* 3D canvas — the hero. Full-bleed on mobile. */}
      <div className="relative -mx-4 h-[44svh] overflow-hidden border-y border-night-600/40 bg-night-900/40 md:mx-0 md:h-[52vh] md:rounded-2xl md:border">
        <ErrorBoundary
          fallback={() => (
            <div className="flex h-full items-center justify-center p-8 text-center text-sm text-ink-300">
              {t('common.webglUnsupported')}
            </div>
          )}
        >
          <Scene />
        </ErrorBoundary>

        {/* top status overlay */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center gap-1.5 p-3">
          {phase === 'idle' && (
            <button
              onClick={() => setControlsOpen(true)}
              className="pointer-events-auto max-w-[92%] truncate rounded-full border border-night-600/60 bg-night-950/70 px-4 py-1.5 text-xs text-ink-200 backdrop-blur"
            >
              {question ? `「${question}」` : t('reading.questionTapHint')}
            </button>
          )}
          {phase === 'picking' && (
            <span className="rounded-full bg-night-950/70 px-3 py-1 text-xs text-ink-300">
              {t('reading.pickPrompt')}
            </span>
          )}
          {phase === 'done' && (
            <span className="rounded-full bg-night-950/70 px-3 py-1 text-xs text-ink-300">
              {t('reading.clickCardHint')}
            </span>
          )}
        </div>
      </div>

      {/* idle: spread picker carousel */}
      {phase === 'idle' && (
        <div className="mt-3">
          <SpreadCarousel />
        </div>
      )}

      <ActionBar
        phase={phase}
        pickedCount={picked.length}
        total={spread?.cardCount ?? 0}
        canShuffle={canShuffle}
        onShuffle={startShuffle}
        onOpenControls={() => setControlsOpen(true)}
        onPrev={() => stepCentered(-1)}
        onNext={() => stepCentered(1)}
        onPickThis={pickCentered}
        onUndo={undoLast}
        onConfirm={confirm}
        onReset={reset}
        onSkip={() => (phase === 'shuffling' ? finishShuffle() : finishReveal())}
        onShare={() => setShareOpen(true)}
      />

      {phase === 'done' && (
        <div className="mt-4 flex flex-col gap-4">
          {drawn.length > 0 && spread && <DrawnList spread={spread} />}
          <InterpretationPanel onInterpret={interpret} onFollowUp={followUp} onCancel={cancel} />
        </div>
      )}

      <ControlsSheet open={controlsOpen} onClose={() => setControlsOpen(false)} />
      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} />
      <CardDetailPanel />
    </div>
  )
}

function DrawnList({ spread }: { spread: Spread }) {
  const { t } = useTranslation()
  const drawn = useDivination((s) => s.drawn)
  const posById = useMemo(() => new Map(spread.positions.map((p) => [p.id, p])), [spread])
  return (
    <div className="rounded-2xl border border-night-600/50 bg-night-800/50 p-4">
      <h3 className="mb-2 font-display text-lg text-gold-300">{t('reading.drawnTitle')}</h3>
      <ul className="grid grid-cols-1 gap-1.5 text-sm sm:grid-cols-2">
        {drawn.map((d) => {
          const card = getCard(d.cardId)
          const pos = posById.get(d.positionId)
          return (
            <li key={d.positionId} className="flex items-baseline justify-between gap-2">
              <span className="text-ink-500">{pos?.label}</span>
              <span className="text-ink-100">
                {card?.nameZh}
                <span
                  className={clsx('ml-1.5 text-xs', d.reversed ? 'text-reversed' : 'text-upright')}
                >
                  {d.reversed ? t('reading.reversed') : t('reading.upright')}
                </span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
