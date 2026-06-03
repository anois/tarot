import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { Button } from '@/ui/Button'
import { Markdown } from '@/ui/Markdown'
import { useDivination } from '../divination.store'
import { useInterpret } from '../useInterpret'
import { useLLMConfig } from '@/store/llmConfig.store'
import { getCard } from '@/deck/cards'
import { getMeaning } from '@/deck/meanings'
import { getCardDetail, type Element } from '@/deck/correspondences'
import { cardImageUrl } from '@/deck/images'

const ELEMENT_CLASS: Record<Element, string> = {
  火: 'bg-red-500/20 text-red-300 border-red-400/40',
  水: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
  风: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40',
  土: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
}

export function CardDetailPanel() {
  const { t } = useTranslation()
  const selectedPositionId = useDivination((s) => s.selectedPositionId)
  const drawn = useDivination((s) => s.drawn)
  const spread = useDivination((s) => s.spread)
  const turns = useDivination((s) => s.turns)
  const streaming = useDivination((s) => s.streaming)
  const interpreting = useDivination((s) => s.interpreting)
  const selectCard = useDivination((s) => s.selectCard)
  const { interpretCard, cancel } = useInterpret()
  const hasKey = useLLMConfig((s) => !!s.config.apiKey)

  // Tracks which card the user requested an interpretation for, so we only show
  // the live stream inside this panel when it's this card's interpretation.
  const [requestedFor, setRequestedFor] = useState<string | null>(null)

  if (!selectedPositionId || !spread) return null
  const d = drawn.find((x) => x.positionId === selectedPositionId)
  const position = spread.positions.find((p) => p.id === selectedPositionId)
  const card = d ? getCard(d.cardId) : undefined
  if (!d || !position || !card) return null

  const detail = getCardDetail(card)
  const meaning = getMeaning(card.id)
  const meanings = (d.reversed ? meaning?.reversed : meaning?.upright)?.slice(0, 5) ?? []
  const myTurn = [...turns]
    .reverse()
    .find((tn) => tn.role === 'followup' && tn.focusPositionId === selectedPositionId)

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={() => selectCard(null)}>
      <div className="absolute inset-0 bg-night-950/70 backdrop-blur-sm" />
      <aside
        className="relative h-full w-full max-w-md overflow-y-auto border-l border-night-600/60 bg-night-900/95 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl text-gold-300">{card.nameZh}</h2>
            <p className="text-sm text-ink-500">{card.nameEn}</p>
          </div>
          <button onClick={() => selectCard(null)} className="text-ink-400 hover:text-ink-100">
            ✕
          </button>
        </div>

        <div className="flex gap-4">
          <img
            src={cardImageUrl(card.imageKey)}
            alt={card.nameZh}
            className="h-44 w-auto shrink-0 rounded-md border border-gold-500/40 object-cover shadow-lg"
            style={{ transform: d.reversed ? 'rotate(180deg)' : undefined }}
          />
          <div className="flex flex-col gap-2 text-sm">
            <Row label={t('reading.cardDetail.position')}>
              {position.label}
              <span className={clsx('ml-1.5 text-xs', d.reversed ? 'text-red-300' : 'text-emerald-300')}>
                {d.reversed ? t('reading.reversed') : t('reading.upright')}
              </span>
            </Row>
            <Row label={t('reading.cardDetail.element')}>
              <span className={clsx('rounded-full border px-2 py-0.5 text-xs', ELEMENT_CLASS[detail.element])}>
                {detail.element}
              </span>
            </Row>
            <Row label={t('reading.cardDetail.astrology')}>{detail.astrology}</Row>
            <Row label={t('reading.cardDetail.numerology')}>{detail.numerology}</Row>
          </div>
        </div>

        {detail.symbolism && (
          <Section title={t('reading.cardDetail.symbolism')}>{detail.symbolism}</Section>
        )}
        {detail.story && <Section title={t('reading.cardDetail.story')}>{detail.story}</Section>}
        {meaning && meaning.keywords.length > 0 && (
          <Section title={t('reading.cardDetail.keywords')}>{meaning.keywords.join(' · ')}</Section>
        )}
        {meanings.length > 0 && (
          <Section title={`${d.reversed ? t('reading.reversed') : t('reading.upright')}${t('reading.cardDetail.meaning')}`}>
            <ul className="ml-4 list-disc space-y-0.5">
              {meanings.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </Section>
        )}

        {/* position-aware LLM interpretation */}
        <div className="mt-5 border-t border-night-600/50 pt-4">
          {interpreting && requestedFor === selectedPositionId ? (
            <div>
              {streaming ? <Markdown>{streaming}</Markdown> : null}
              <div className="mt-2 flex items-center gap-3">
                <span className="animate-pulse text-sm text-mystic-200">{t('reading.revealing')}</span>
                <Button variant="ghost" className="px-3 py-1 text-xs" onClick={cancel}>
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          ) : myTurn ? (
            <>
              <Markdown>{myTurn.content}</Markdown>
              <Button
                variant="ghost"
                className="mt-2 px-3 py-1 text-xs"
                disabled={!hasKey || interpreting}
                onClick={() => {
                  setRequestedFor(position.id)
                  interpretCard(position.id, position.label, card.nameZh, d.reversed)
                }}
              >
                {t('reading.cardDetail.reinterpret')}
              </Button>
            </>
          ) : (
            <Button
              disabled={!hasKey || interpreting}
              onClick={() => {
                setRequestedFor(position.id)
                interpretCard(position.id, position.label, card.nameZh, d.reversed)
              }}
            >
              {hasKey ? t('reading.cardDetail.interpret') : t('settings.needConfig')}
            </Button>
          )}
        </div>
      </aside>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="shrink-0 text-xs text-ink-500">{label}</span>
      <span className="text-ink-100">{children}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <h3 className="mb-1 text-sm font-medium text-gold-300">{title}</h3>
      <div className="text-sm leading-relaxed text-ink-200">{children}</div>
    </div>
  )
}
