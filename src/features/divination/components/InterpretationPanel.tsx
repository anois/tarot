import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '@/ui/Button'
import { Markdown } from '@/ui/Markdown'
import { useDivination } from '../divination.store'
import { useLLMConfig } from '@/store/llmConfig.store'

interface Props {
  onInterpret: () => void
  onFollowUp: (question: string, focusLabel?: string) => void
  onCancel: () => void
}

export function InterpretationPanel({ onInterpret, onFollowUp, onCancel }: Props) {
  const { t } = useTranslation()
  const turns = useDivination((s) => s.turns)
  const streaming = useDivination((s) => s.streaming)
  const interpreting = useDivination((s) => s.interpreting)
  const error = useDivination((s) => s.interpretError)
  const spread = useDivination((s) => s.spread)
  const hasKey = useLLMConfig((s) => !!s.config.apiKey)

  const [followupQ, setFollowupQ] = useState('')
  const [focus, setFocus] = useState('')

  const hasContent = turns.length > 0 || streaming != null || interpreting

  function submitFollowup() {
    const q = followupQ.trim()
    if (!q) return
    onFollowUp(q, focus || undefined)
    setFollowupQ('')
  }

  return (
    <section className="rounded-2xl border border-night-600/50 bg-night-800/50 p-6">
      {!hasContent && (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          {hasKey ? (
            <Button onClick={onInterpret}>{t('reading.interpret')}</Button>
          ) : (
            <>
              <p className="text-sm text-ink-300">{t('settings.needConfig')}</p>
              <Link to="/settings">
                <Button variant="secondary">{t('nav.settings')}</Button>
              </Link>
            </>
          )}
        </div>
      )}

      {turns.map((turn, i) => (
        <article key={i} className="mb-4 border-b border-night-600/40 pb-4 last:border-0">
          {turn.role === 'followup' && turn.question && (
            <p className="mb-2 text-sm text-mystic-200">追问：{turn.question}</p>
          )}
          <Markdown>{turn.content}</Markdown>
        </article>
      ))}

      {interpreting && (
        <div>
          {streaming ? <Markdown>{streaming}</Markdown> : null}
          <div className="mt-2 flex items-center gap-3">
            <span className="animate-pulse text-sm text-mystic-200">{t('reading.revealing')}</span>
            <Button variant="ghost" className="px-3 py-1 text-xs" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
          <div className="mt-2">
            <Button variant="secondary" className="px-3 py-1 text-xs" onClick={onInterpret}>
              {t('reading.interpret')}
            </Button>
          </div>
        </div>
      )}

      {turns.length > 0 && !interpreting && spread && (
        <div className="mt-4 border-t border-night-600/40 pt-4">
          <h3 className="mb-2 font-display text-lg text-gold-300">{t('reading.followupTitle')}</h3>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              className="rounded-lg border border-night-600 bg-night-900/70 p-2 text-sm text-ink-100 outline-none focus:border-mystic-400"
            >
              <option value="">{t('reading.focusGeneral')}</option>
              {spread.positions.map((p) => (
                <option key={p.id} value={p.label}>
                  {p.label}
                </option>
              ))}
            </select>
            <input
              value={followupQ}
              onChange={(e) => setFollowupQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitFollowup()
              }}
              placeholder={t('reading.followupPlaceholder')}
              className="flex-1 rounded-lg border border-night-600 bg-night-900/70 p-2 text-sm text-ink-100 outline-none focus:border-mystic-400"
            />
            <Button onClick={submitFollowup} disabled={!followupQ.trim()}>
              {t('reading.askFollowup')}
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
