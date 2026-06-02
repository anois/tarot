import { useTranslation } from 'react-i18next'
import { Button } from '@/ui/Button'
import type { SpreadPosition } from '@/spreads/types'

const field =
  'w-full rounded-lg border border-night-600 bg-night-900/70 p-2 text-sm text-ink-100 outline-none focus:border-mystic-400'

export function PositionInspector({
  position,
  onChange,
  onDelete,
  canDelete,
}: {
  position: SpreadPosition
  onChange: (patch: Partial<SpreadPosition>) => void
  onDelete: () => void
  canDelete: boolean
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="mb-1 block text-xs text-ink-400">{t('editorPage.label')}</label>
        <input value={position.label} onChange={(e) => onChange({ label: e.target.value })} className={field} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-ink-400">{t('editorPage.meaning')}</label>
        <textarea
          value={position.meaning}
          onChange={(e) => onChange({ meaning: e.target.value })}
          rows={2}
          className={`${field} resize-none`}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-ink-400">
          {t('editorPage.rotation')}：{position.rotation}°
        </label>
        <input
          type="range"
          min={-180}
          max={180}
          step={5}
          value={position.rotation}
          onChange={(e) => onChange({ rotation: Number(e.target.value) })}
          className="w-full accent-mystic-400"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs text-ink-400">{t('editorPage.zorder')}</label>
          <input
            type="number"
            value={position.z}
            onChange={(e) => onChange({ z: Math.round(Number(e.target.value)) || 0 })}
            className={field}
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs text-ink-400">{t('editorPage.prompt')}</label>
        <input
          value={position.prompt ?? ''}
          onChange={(e) => onChange({ prompt: e.target.value || undefined })}
          className={field}
        />
      </div>
      <Button
        variant="ghost"
        className="self-start text-red-300"
        onClick={onDelete}
        disabled={!canDelete}
      >
        {t('editorPage.deletePosition')}
      </Button>
    </div>
  )
}
