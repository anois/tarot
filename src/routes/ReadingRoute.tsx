import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import clsx from 'clsx'
import { Button } from '@/ui/Button'
import { ErrorBoundary } from '@/ui/ErrorBoundary'
import { Scene } from '@/features/deck3d/Scene'
import { useDivination } from '@/features/divination/divination.store'
import { useInterpret } from '@/features/divination/useInterpret'
import { InterpretationPanel } from '@/features/divination/components/InterpretationPanel'
import { BUILTIN_SPREADS, getBuiltinSpread } from '@/spreads/registry'
import { listStoredSpreads, getStoredSpread } from '@/spreads/repo'
import { getCard } from '@/deck/cards'
import type { ReadingTemplate } from '@/reading/types'
import type { Spread } from '@/spreads/types'

const INITIAL_TEMPLATES: ReadingTemplate[] = ['structured', 'narrative', 'quick']

interface NavState {
  spreadId?: string
  spreadUuid?: string
}

export default function ReadingRoute() {
  const { t } = useTranslation()
  const location = useLocation()
  const stored = useLiveQuery(() => listStoredSpreads(), [], [])

  const phase = useDivination((s) => s.phase)
  const spread = useDivination((s) => s.spread)
  const question = useDivination((s) => s.question)
  const template = useDivination((s) => s.template)
  const picked = useDivination((s) => s.picked)
  const drawn = useDivination((s) => s.drawn)
  const reversedProbability = useDivination((s) => s.reversedProbability)
  const majorOnly = useDivination((s) => s.majorOnly)
  const setSpread = useDivination((s) => s.setSpread)
  const setQuestion = useDivination((s) => s.setQuestion)
  const setTemplate = useDivination((s) => s.setTemplate)
  const setReversedProbability = useDivination((s) => s.setReversedProbability)
  const setMajorOnly = useDivination((s) => s.setMajorOnly)
  const startShuffle = useDivination((s) => s.startShuffle)
  const undoLast = useDivination((s) => s.undoLast)
  const confirm = useDivination((s) => s.confirm)
  const reset = useDivination((s) => s.reset)
  const { interpret, followUp, cancel } = useInterpret()

  // Initial spread key: honor navigation from the Spreads page, else current/default.
  const [selKey, setSelKey] = useState<string>(() => {
    const st = location.state as NavState | null
    if (st?.spreadId) return `builtin:${st.spreadId}`
    if (st?.spreadUuid) return `stored:${st.spreadUuid}`
    return spread ? `builtin:${spread.id}` : 'builtin:three-card'
  })

  // Resolve the dropdown key to a Spread and push into the store.
  useEffect(() => {
    let active = true
    async function resolve(key: string) {
      if (key.startsWith('builtin:')) {
        const s = getBuiltinSpread(key.slice('builtin:'.length))
        if (s && active) setSpread(s)
      } else if (key.startsWith('stored:')) {
        const ss = await getStoredSpread(key.slice('stored:'.length))
        if (ss && active) setSpread(ss.spread)
      }
    }
    void resolve(selKey)
    return () => {
      active = false
    }
  }, [selKey, setSpread])

  const locked = phase !== 'idle'
  const tooManyForMajor = majorOnly && !!spread && spread.cardCount > 22

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <aside className="flex flex-col gap-4">
        <div className="rounded-2xl border border-night-600/50 bg-night-800/50 p-4">
          <label className="mb-1 block text-sm text-ink-300">{t('reading.questionLabel')}</label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t('reading.questionPlaceholder')}
            rows={3}
            className="w-full resize-none rounded-lg border border-night-600 bg-night-900/70 p-2 text-sm text-ink-100 outline-none focus:border-mystic-400"
          />

          <label className="mb-1 mt-4 block text-sm text-ink-300">{t('reading.pickSpread')}</label>
          <select
            value={selKey}
            onChange={(e) => setSelKey(e.target.value)}
            disabled={locked}
            className="w-full rounded-lg border border-night-600 bg-night-900/70 p-2 text-sm text-ink-100 outline-none focus:border-mystic-400 disabled:opacity-50"
          >
            <optgroup label={t('spreadsPage.builtin')}>
              {BUILTIN_SPREADS.map((s) => (
                <option key={s.id} value={`builtin:${s.id}`}>
                  {s.name}（{s.cardCount}）
                </option>
              ))}
            </optgroup>
            {stored && stored.length > 0 && (
              <optgroup label={t('spreadsPage.custom')}>
                {stored.map((ss) => (
                  <option key={ss.uuid} value={`stored:${ss.uuid}`}>
                    {ss.spread.name}（{ss.spread.cardCount}）
                  </option>
                ))}
              </optgroup>
            )}
          </select>

          <label className="mb-1 mt-4 block text-sm text-ink-300">{t('reading.pickTemplate')}</label>
          <div className="flex flex-wrap gap-1.5">
            {INITIAL_TEMPLATES.map((tpl) => (
              <button
                key={tpl}
                onClick={() => setTemplate(tpl)}
                className={clsx(
                  'rounded-full px-3 py-1 text-xs transition-colors',
                  template === tpl
                    ? 'bg-mystic-400 text-night-950'
                    : 'border border-night-600 text-ink-300 hover:text-ink-100',
                )}
              >
                {t(`reading.templates.${tpl}`)}
              </button>
            ))}
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm text-ink-300">
            <input
              type="checkbox"
              checked={reversedProbability > 0}
              disabled={locked}
              onChange={(e) => setReversedProbability(e.target.checked ? 0.5 : 0)}
            />
            {t('reading.includeReversed')}
          </label>
          <label className="mt-2 flex items-center gap-2 text-sm text-ink-300">
            <input
              type="checkbox"
              checked={majorOnly}
              disabled={locked}
              onChange={(e) => setMajorOnly(e.target.checked)}
            />
            {t('reading.majorOnly')}
          </label>
          {tooManyForMajor && (
            <p className="mt-1 text-xs text-amber-300">{t('reading.tooManyForMajor')}</p>
          )}
        </div>

        {phase === 'done' && drawn.length > 0 && spread && (
          <DrawnList spread={spread} />
        )}
      </aside>

      <div className="relative min-h-[60vh] overflow-hidden rounded-2xl border border-night-600/50 bg-night-900/40">
        <ErrorBoundary
          fallback={() => (
            <div className="flex h-full min-h-[60vh] items-center justify-center p-8 text-center text-sm text-ink-300">
              {t('common.webglUnsupported')}
            </div>
          )}
        >
          <Scene />
        </ErrorBoundary>
        <Hud
          phase={phase}
          pickedCount={picked.length}
          total={spread?.cardCount ?? 0}
          canShuffle={!!spread && !tooManyForMajor}
          onShuffle={startShuffle}
          onUndo={undoLast}
          onConfirm={confirm}
          onReset={reset}
        />
      </div>
      </div>
      {phase === 'done' && (
        <InterpretationPanel onInterpret={interpret} onFollowUp={followUp} onCancel={cancel} />
      )}
    </div>
  )
}

function Hud({
  phase,
  pickedCount,
  total,
  canShuffle,
  onShuffle,
  onUndo,
  onConfirm,
  onReset,
}: {
  phase: string
  pickedCount: number
  total: number
  canShuffle: boolean
  onShuffle: () => void
  onUndo: () => void
  onConfirm: () => void
  onReset: () => void
}) {
  const { t } = useTranslation()
  return (
    <>
      {/* status — top, so it never covers the focal ribbon card */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center gap-1 p-4">
        {phase === 'picking' && (
          <>
            <span className="rounded-full bg-night-950/80 px-3 py-1 text-sm text-gold-300">
              {t('reading.pickHint', { count: pickedCount, total })}
            </span>
            <span className="rounded-full bg-night-950/60 px-3 py-0.5 text-xs text-ink-300">
              {t('reading.pickPrompt')}
            </span>
          </>
        )}
        {phase === 'shuffling' && (
          <span className="rounded-full bg-night-950/80 px-3 py-1 text-sm text-ink-300">
            {t('reading.shuffling')}
          </span>
        )}
        {phase === 'revealing' && (
          <span className="rounded-full bg-night-950/80 px-3 py-1 text-sm text-ink-300">
            {t('reading.revealing')}
          </span>
        )}
      </div>

      {/* actions — bottom */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-4">
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2">
          {phase === 'idle' && (
            <Button onClick={onShuffle} disabled={!canShuffle}>
              {canShuffle ? t('reading.shuffle') : t('reading.needSpread')}
            </Button>
          )}
          {phase === 'picking' && (
            <>
              <Button variant="ghost" onClick={onUndo} disabled={pickedCount === 0}>
                {t('reading.undo')}
              </Button>
              <Button onClick={onConfirm} disabled={pickedCount !== total}>
                {t('reading.confirm')}
              </Button>
              <Button variant="ghost" onClick={onReset}>
                {t('reading.reset')}
              </Button>
            </>
          )}
          {phase === 'done' && (
            <Button variant="secondary" onClick={onReset}>
              {t('reading.reset')}
            </Button>
          )}
        </div>
      </div>
    </>
  )
}

function DrawnList({ spread }: { spread: Spread }) {
  const { t } = useTranslation()
  const drawn = useDivination((s) => s.drawn)
  const posById = useMemo(() => new Map(spread.positions.map((p) => [p.id, p])), [spread])
  return (
    <div className="rounded-2xl border border-night-600/50 bg-night-800/50 p-4">
      <h3 className="mb-2 font-display text-lg text-gold-300">{t('reading.drawnTitle')}</h3>
      <ul className="flex flex-col gap-1.5 text-sm">
        {drawn.map((d) => {
          const card = getCard(d.cardId)
          const pos = posById.get(d.positionId)
          return (
            <li key={d.positionId} className="flex items-baseline justify-between gap-2">
              <span className="text-ink-500">{pos?.label}</span>
              <span className="text-ink-100">
                {card?.nameZh}
                <span className={clsx('ml-1.5 text-xs', d.reversed ? 'text-red-300' : 'text-emerald-300')}>
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
