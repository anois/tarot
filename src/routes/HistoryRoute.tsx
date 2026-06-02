import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLiveQuery } from 'dexie-react-hooks'
import { PageHeading } from '@/ui/Panel'
import { Button } from '@/ui/Button'
import { Markdown } from '@/ui/Markdown'
import { DrawnSpreadView } from '@/reading/DrawnSpreadView'
import { getCard } from '@/deck/cards'
import { listReadings, getReading, deleteReading, putReading } from '@/reading/repo'
import { downloadReading, importReadingFromFile } from '@/reading/io'
import type { Reading } from '@/reading/types'

function fmtDate(ts: number): string {
  const d = new Date(ts)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export default function HistoryRoute() {
  const { t } = useTranslation()
  const readings = useLiveQuery(() => listReadings(), [], [])
  const [selected, setSelected] = useState<Reading | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)

  async function onImport(file: File) {
    setImportError(null)
    const r = await importReadingFromFile(file)
    if (!r.ok) {
      setImportError(t('historyPage.importError') + r.message)
      return
    }
    await putReading(r.reading)
  }

  if (selected) {
    return <ReadingDetail reading={selected} onBack={() => setSelected(null)} />
  }

  return (
    <div>
      <PageHeading title={t('nav.history')} />
      <div className="mb-4 flex items-center gap-3">
        <Button variant="secondary" onClick={() => fileRef.current?.click()}>
          {t('historyPage.importBtn')}
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

      {readings && readings.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {readings.map((r) => (
            <li key={r.id}>
              <button
                onClick={() => void getReading(r.id).then((full) => full && setSelected(full))}
                className="flex w-full gap-3 rounded-2xl border border-night-600/50 bg-night-800/50 p-3 text-left transition-colors hover:border-mystic-400/60"
              >
                <div className="w-24 shrink-0">
                  <DrawnSpreadView spread={r.spreadSnapshot} drawn={r.drawn} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-ink-100">{r.question || t('historyPage.noQuestion')}</p>
                  <p className="mt-1 text-xs text-ink-500">{r.spreadSnapshot.name}</p>
                  <p className="mt-1 text-xs text-ink-500">{fmtDate(r.createdAt)}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-500">{t('historyPage.empty')}</p>
      )}
    </div>
  )
}

function ReadingDetail({ reading, onBack }: { reading: Reading; onBack: () => void }) {
  const { t } = useTranslation()
  const posLabel = new Map(reading.spreadSnapshot.positions.map((p) => [p.id, p.label]))

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Button variant="ghost" onClick={onBack}>
          ← {t('historyPage.back')}
        </Button>
        <Button variant="secondary" onClick={() => downloadReading(reading)}>
          {t('common.export')}
        </Button>
        <Button
          variant="ghost"
          className="text-red-300"
          onClick={() => void deleteReading(reading.id).then(onBack)}
        >
          {t('common.delete')}
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <h1 className="mb-1 font-display text-2xl text-gold-300">
            {reading.question || t('historyPage.noQuestion')}
          </h1>
          <p className="text-sm text-ink-500">
            {reading.spreadSnapshot.name} · {fmtDate(reading.createdAt)} · {t('historyPage.model')}：
            {reading.modelUsed}
          </p>
          <div className="mt-3 max-w-sm">
            <DrawnSpreadView spread={reading.spreadSnapshot} drawn={reading.drawn} />
          </div>
          <ul className="mt-3 flex flex-col gap-1 text-sm">
            {[...reading.drawn]
              .sort((a, b) => a.index - b.index)
              .map((d) => (
                <li key={d.positionId} className="flex justify-between gap-2">
                  <span className="text-ink-500">{posLabel.get(d.positionId)}</span>
                  <span className="text-ink-300">
                    {getCard(d.cardId)?.nameZh ?? d.cardId}{' '}
                    <span className={d.reversed ? 'text-red-300' : 'text-emerald-300'}>
                      {d.reversed ? t('reading.reversed') : t('reading.upright')}
                    </span>
                  </span>
                </li>
              ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-night-600/50 bg-night-800/50 p-5">
          {reading.turns.map((turn, i) => (
            <article key={i} className="mb-4 border-b border-night-600/40 pb-4 last:border-0">
              {turn.role === 'followup' && turn.question && (
                <p className="mb-2 text-sm text-mystic-200">追问：{turn.question}</p>
              )}
              <Markdown>{turn.content}</Markdown>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
