import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { Sheet } from '@/ui/Sheet'
import { Toggle } from '@/ui/Toggle'
import { useDivination } from '../divination.store'
import { usePrefs } from '@/store/prefs.store'
import { BACK_STYLES, CLOTH_STYLES, FACE_STYLES } from '@/features/deck3d/skins'
import type { ReadingTemplate } from '@/reading/types'

const INITIAL_TEMPLATES: ReadingTemplate[] = ['structured', 'narrative', 'quick', 'overall']

/** The question + template + options + appearance drawer (was the left rail). */
export function ControlsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const phase = useDivination((s) => s.phase)
  const question = useDivination((s) => s.question)
  const template = useDivination((s) => s.template)
  const reversedProbability = useDivination((s) => s.reversedProbability)
  const majorOnly = useDivination((s) => s.majorOnly)
  const spread = useDivination((s) => s.spread)
  const setQuestion = useDivination((s) => s.setQuestion)
  const setTemplate = useDivination((s) => s.setTemplate)
  const setReversedProbability = useDivination((s) => s.setReversedProbability)
  const setMajorOnly = useDivination((s) => s.setMajorOnly)

  const deckBack = usePrefs((s) => s.deckBack)
  const cardFace = usePrefs((s) => s.cardFace)
  const tableCloth = usePrefs((s) => s.tableCloth)
  const setDeckBack = usePrefs((s) => s.setDeckBack)
  const setCardFace = usePrefs((s) => s.setCardFace)
  const setTableCloth = usePrefs((s) => s.setTableCloth)

  const locked = phase !== 'idle'
  const tooManyForMajor = majorOnly && !!spread && spread.cardCount > 22

  return (
    <Sheet open={open} onClose={onClose} title={t('reading.controlsTitle')}>
      <div className="flex flex-col gap-5">
        <div>
          <label className="mb-1.5 block text-sm text-ink-300">{t('reading.questionLabel')}</label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t('reading.questionPlaceholder')}
            rows={3}
            className="w-full resize-none rounded-xl border border-night-600 bg-night-900/70 p-3 text-sm text-ink-100 outline-none focus:border-gold-400"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-ink-300">{t('reading.pickTemplate')}</label>
          <div className="flex flex-wrap gap-2">
            {INITIAL_TEMPLATES.map((tpl) => (
              <button
                key={tpl}
                onClick={() => setTemplate(tpl)}
                className={clsx(
                  'min-h-9 touch-manipulation rounded-full px-3.5 py-1.5 text-sm transition-colors',
                  template === tpl
                    ? 'bg-gold-400 text-night-950'
                    : 'border border-night-600 text-ink-300 hover:text-ink-100',
                )}
              >
                {t(`reading.templates.${tpl}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Toggle
            label={t('reading.includeReversed')}
            checked={reversedProbability > 0}
            disabled={locked}
            onChange={(v) => setReversedProbability(v ? 0.5 : 0)}
          />
          <Toggle
            label={t('reading.majorOnly')}
            checked={majorOnly}
            disabled={locked}
            onChange={setMajorOnly}
          />
          {tooManyForMajor && (
            <p className="px-1 text-xs text-warning">{t('reading.tooManyForMajor')}</p>
          )}
        </div>

        <div>
          <span className="mb-2 block text-sm text-ink-300">{t('reading.appearance')}</span>
          <div className="grid grid-cols-3 gap-2">
            <StyleSelect
              label={t('reading.deckBack')}
              value={deckBack}
              options={BACK_STYLES}
              onChange={(v) => setDeckBack(v as typeof deckBack)}
            />
            <StyleSelect
              label={t('reading.cardFace')}
              value={cardFace}
              options={FACE_STYLES}
              onChange={(v) => setCardFace(v as typeof cardFace)}
            />
            <StyleSelect
              label={t('reading.tableCloth')}
              value={tableCloth}
              options={CLOTH_STYLES}
              onChange={(v) => setTableCloth(v as typeof tableCloth)}
            />
          </div>
        </div>
      </div>
    </Sheet>
  )
}

function StyleSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: readonly { id: string; name: string }[]
  onChange: (v: string) => void
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-ink-400">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-10 rounded-lg border border-night-600 bg-night-900/70 px-2 text-xs text-ink-100 outline-none focus:border-gold-400"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </label>
  )
}
