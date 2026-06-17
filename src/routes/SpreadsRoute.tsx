import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { PageHeading } from '@/ui/Panel'
import { Button } from '@/ui/Button'
import { SpreadPreview } from '@/spreads/SpreadPreview'
import { BUILTIN_SPREADS } from '@/spreads/registry'
import { SPREAD_CATEGORIES } from '@/spreads/categories'
import { downloadSpread, importSpreadFromFile } from '@/spreads/io'
import { listStoredSpreads, saveSpread, deleteStoredSpread } from '@/spreads/repo'
import { useDivination } from '@/features/divination/divination.store'
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

  // Selecting a spread here writes the store directly (the single seam) and
  // jumps to the reading flow — no nav-state handoff needed.
  function chooseSpread(spread: Spread) {
    useDivination.getState().setSpread(spread)
    navigate('/')
  }
  function duplicateToEditor(spread: Spread, builtinId?: string) {
    navigate('/editor', { state: { spread, builtinId } })
  }

  return (
    <div>
      <PageHeading title={t('nav.spreads')} subtitle={t('spreadsPage.subtitle')} />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Button variant="primary" size="sm" onClick={() => navigate('/editor')}>
          ＋ {t('editorPage.newSpread')}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
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
        {importError && <span className="text-sm text-reversed">{importError}</span>}
      </div>

      {SPREAD_CATEGORIES.map((c) => {
        const list = BUILTIN_SPREADS.filter((s) => s.category === c.id)
        if (!list.length) return null
        return (
          <section key={c.id} className="mb-8">
            <h2 className="mb-3 font-display text-xl text-gold-300">
              <span className="mr-1.5 text-gold-400">{c.glyph}</span>
              {c.label}
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {list.map((s) => (
                <SpreadTile
                  key={s.id}
                  spread={s}
                  onUse={() => chooseSpread(s)}
                  onDuplicate={() => duplicateToEditor(s, s.id)}
                  onExport={() => downloadSpread(s)}
                />
              ))}
            </div>
          </section>
        )
      })}

      <h2 className="mb-3 mt-8 font-display text-xl text-gold-300">{t('spreadsPage.custom')}</h2>
      {stored && stored.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {stored.map((ss) => (
            <SpreadTile
              key={ss.uuid}
              spread={ss.spread}
              onUse={() => chooseSpread(ss.spread)}
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
    <div className="flex flex-col gap-2.5 rounded-2xl border border-night-600/50 bg-night-800/50 p-3">
      <SpreadPreview spread={spread} />
      <div className="flex items-baseline justify-between gap-2">
        <span className="min-w-0 truncate font-medium text-ink-100" title={spread.name}>
          {spread.name}
        </span>
        <span className="shrink-0 text-xs text-ink-500">
          {t('spreadsPage.cards', { n: spread.cardCount })}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="primary" size="sm" className="flex-1" onClick={onUse}>
          {t('spreadsPage.use')}
        </Button>
        <OverflowMenu>
          <MenuItem onClick={onDuplicate}>{t('spreadsPage.duplicate')}</MenuItem>
          <MenuItem onClick={onExport}>{t('common.export')}</MenuItem>
          {onDelete && (
            <MenuItem onClick={onDelete} danger>
              {t('common.delete')}
            </MenuItem>
          )}
        </OverflowMenu>
      </div>
    </div>
  )
}

function OverflowMenu({ children }: { children: React.ReactNode }) {
  return (
    <details className="relative shrink-0">
      <summary className="flex h-9 w-9 cursor-pointer touch-manipulation list-none items-center justify-center rounded-full text-lg text-ink-300 transition-colors hover:bg-night-700/60 hover:text-ink-100 [&::-webkit-details-marker]:hidden">
        ⋯
      </summary>
      <div className="absolute right-0 z-10 mt-1 flex min-w-32 flex-col overflow-hidden rounded-xl border border-night-600/70 bg-night-800 py-1 shadow-2xl">
        {children}
      </div>
    </details>
  )
}

function MenuItem({
  onClick,
  danger,
  children,
}: {
  onClick: () => void
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      className={
        'px-3 py-2 text-left text-sm transition-colors hover:bg-night-700/70 ' +
        (danger ? 'text-reversed' : 'text-ink-200')
      }
      onClick={(e) => {
        e.currentTarget.closest('details')?.removeAttribute('open')
        onClick()
      }}
    >
      {children}
    </button>
  )
}
