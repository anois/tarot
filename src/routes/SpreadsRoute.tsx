import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { PageHeading } from '@/ui/Panel'
import { Button } from '@/ui/Button'
import { SpreadPreview } from '@/spreads/SpreadPreview'
import { BUILTIN_SPREADS } from '@/spreads/registry'
import { downloadSpread, importSpreadFromFile } from '@/spreads/io'
import { listStoredSpreads, saveSpread, deleteStoredSpread } from '@/spreads/repo'
import type { Spread } from '@/spreads/types'

export default function SpreadsRoute() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const stored = useLiveQuery(() => listStoredSpreads(), [], [])

  async function onImport(file: File) {
    setImportError(null)
    const result = await importSpreadFromFile(file)
    if (!result.ok) {
      setImportError(result.issues.map((i) => `${i.path}: ${i.message}`).join('；'))
      return
    }
    await saveSpread(result.spread)
  }

  function duplicateToEditor(spread: Spread, builtinId?: string) {
    navigate('/editor', { state: { spread, builtinId } })
  }

  return (
    <div>
      <PageHeading title={t('nav.spreads')} />

      <div className="mb-4 flex items-center gap-3">
        <Button variant="secondary" onClick={() => fileRef.current?.click()}>
          {t('spreadsPage.importBtn')}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void onImport(f)
            e.target.value = ''
          }}
        />
        {importError && <span className="text-sm text-red-400">{importError}</span>}
      </div>

      <h2 className="mb-3 font-display text-xl text-gold-300">{t('spreadsPage.builtin')}</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {BUILTIN_SPREADS.map((s) => (
          <SpreadTile
            key={s.id}
            spread={s}
            onUse={() => navigate('/', { state: { spreadId: s.id } })}
            onDuplicate={() => duplicateToEditor(s, s.id)}
            onExport={() => downloadSpread(s)}
          />
        ))}
      </div>

      <h2 className="mb-3 mt-8 font-display text-xl text-gold-300">{t('spreadsPage.custom')}</h2>
      {stored && stored.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {stored.map((ss) => (
            <SpreadTile
              key={ss.uuid}
              spread={ss.spread}
              onUse={() => navigate('/', { state: { spreadUuid: ss.uuid } })}
              onDuplicate={() => duplicateToEditor(ss.spread)}
              onExport={() => downloadSpread(ss.spread)}
              onDelete={() => void deleteStoredSpread(ss.uuid)}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-ink-500">{t('spreadsPage.empty')}</p>
      )}
    </div>
  )
}

function SpreadTile({
  spread,
  onUse,
  onDuplicate,
  onExport,
  onDelete,
}: {
  spread: Spread
  onUse: () => void
  onDuplicate: () => void
  onExport: () => void
  onDelete?: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-night-600/50 bg-night-800/50 p-3">
      <SpreadPreview spread={spread} />
      <div className="flex items-baseline justify-between gap-2">
        <span className="min-w-0 truncate font-medium text-ink-100" title={spread.name}>
          {spread.name}
        </span>
        <span className="shrink-0 text-xs text-ink-500">
          {t('spreadsPage.cards', { n: spread.cardCount })}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Button variant="primary" className="px-3 py-1 text-xs" onClick={onUse}>
          {t('spreadsPage.use')}
        </Button>
        <Button variant="ghost" className="px-3 py-1 text-xs" onClick={onDuplicate}>
          {t('spreadsPage.duplicate')}
        </Button>
        <Button variant="ghost" className="px-3 py-1 text-xs" onClick={onExport}>
          {t('common.export')}
        </Button>
        {onDelete && (
          <Button variant="ghost" className="px-3 py-1 text-xs text-red-300" onClick={onDelete}>
            {t('common.delete')}
          </Button>
        )}
      </div>
    </div>
  )
}
