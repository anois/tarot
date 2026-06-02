import { useRef, useState, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useDrag } from '@use-gesture/react'
import clsx from 'clsx'
import { Button } from '@/ui/Button'
import { PositionInspector } from './PositionInspector'
import { addPosition, deletePosition, makeBlankSpread, movePosition, updatePosition } from './draft'
import { validateSpread } from '@/spreads/validate'
import { saveSpread } from '@/spreads/repo'
import { isSafeImageDataUrl, sanitizeImageToDataUrl } from '@/lib/image-sanitize'
import type { Spread, SpreadPosition } from '@/spreads/types'

const field =
  'w-full rounded-lg border border-night-600 bg-night-900/70 p-2 text-sm text-ink-100 outline-none focus:border-mystic-400'

export function SpreadEditor({ initial, builtinId }: { initial?: Spread; builtinId?: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const areaRef = useRef<HTMLDivElement>(null)
  const bgRef = useRef<HTMLInputElement>(null)

  const [draft, setDraft] = useState<Spread>(() =>
    initial ? structuredClone(initial) : makeBlankSpread(),
  )
  const [selectedId, setSelectedId] = useState<string>(draft.positions[0]?.id ?? '')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selected = draft.positions.find((p) => p.id === selectedId)
  const aspect = draft.aspectRatio ?? 1
  const bg = draft.background
  const bgUrl =
    bg && bg.type !== 'none' && bg.value && (bg.type === 'url' || isSafeImageDataUrl(bg.value))
      ? bg.value
      : undefined

  function patchPos(id: string, patch: Partial<SpreadPosition>) {
    setDraft((d) => updatePosition(d, id, patch))
    setSaved(false)
  }

  async function onBgFile(file: File) {
    setError(null)
    try {
      const dataUrl = await sanitizeImageToDataUrl(file)
      setDraft((d) => ({ ...d, background: { type: 'dataURL', value: dataUrl, fit: 'cover' } }))
      setSaved(false)
    } catch (e) {
      setError(t('editorPage.bgError') + (e instanceof Error ? e.message : String(e)))
    }
  }

  function save() {
    setError(null)
    const result = validateSpread(draft)
    if (!result.ok) {
      setError(t('editorPage.validationFailed') + result.issues.map((i) => i.message).join('；'))
      return
    }
    void saveSpread(result.spread, { builtinId }).then(() => {
      setSaved(true)
      setTimeout(() => navigate('/spreads'), 700)
    })
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      {/* Editing canvas */}
      <div
        ref={areaRef}
        className="relative w-full select-none overflow-hidden rounded-2xl border border-night-600/60 bg-night-900/60"
        style={{ aspectRatio: String(aspect) }}
        onPointerDown={(e) => {
          if (e.target === areaRef.current) setSelectedId('')
        }}
      >
        {bgUrl && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `url("${bgUrl}")`,
              backgroundSize: bg?.fit === 'fill' ? '100% 100%' : (bg?.fit ?? 'cover'),
              backgroundPosition: 'center',
              opacity: 0.5,
            }}
          />
        )}
        {draft.positions.map((p) => (
          <DraggablePosition
            key={p.id}
            pos={p}
            spread={draft}
            areaRef={areaRef}
            selected={p.id === selectedId}
            onSelect={() => setSelectedId(p.id)}
            onMove={(x, y) => {
              setDraft((d) => movePosition(d, p.id, x, y))
              setSaved(false)
            }}
          />
        ))}
      </div>

      {/* Right panel */}
      <aside className="flex flex-col gap-4">
        <div className="rounded-2xl border border-night-600/50 bg-night-800/50 p-4">
          <label className="mb-1 block text-xs text-ink-400">{t('editorPage.name')}</label>
          <input
            value={draft.name}
            onChange={(e) => {
              setDraft((d) => ({ ...d, name: e.target.value }))
              setSaved(false)
            }}
            className={field}
          />
          <label className="mb-1 mt-3 block text-xs text-ink-400">{t('editorPage.description')}</label>
          <textarea
            value={draft.description ?? ''}
            onChange={(e) => {
              setDraft((d) => ({ ...d, description: e.target.value }))
              setSaved(false)
            }}
            rows={2}
            className={`${field} resize-none`}
          />
          <label className="mb-1 mt-3 block text-xs text-ink-400">
            {t('editorPage.aspect')}：{aspect.toFixed(2)}
          </label>
          <input
            type="range"
            min={0.6}
            max={2}
            step={0.05}
            value={aspect}
            onChange={(e) => {
              setDraft((d) => ({ ...d, aspectRatio: Number(e.target.value) }))
              setSaved(false)
            }}
            className="w-full accent-mystic-400"
          />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-ink-400">{t('editorPage.cardWidth')}</label>
              <input
                type="range"
                min={0.06}
                max={0.4}
                step={0.01}
                value={draft.card.widthRatio}
                onChange={(e) => {
                  setDraft((d) => ({ ...d, card: { ...d.card, widthRatio: Number(e.target.value) } }))
                  setSaved(false)
                }}
                className="w-full accent-mystic-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink-400">{t('editorPage.cardHeight')}</label>
              <input
                type="range"
                min={0.1}
                max={0.6}
                step={0.01}
                value={draft.card.heightRatio}
                onChange={(e) => {
                  setDraft((d) => ({ ...d, card: { ...d.card, heightRatio: Number(e.target.value) } }))
                  setSaved(false)
                }}
                className="w-full accent-mystic-400"
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button variant="secondary" className="px-3 py-1 text-xs" onClick={() => bgRef.current?.click()}>
              {t('editorPage.uploadBg')}
            </Button>
            {bgUrl && (
              <Button
                variant="ghost"
                className="px-3 py-1 text-xs"
                onClick={() => setDraft((d) => ({ ...d, background: { type: 'none' } }))}
              >
                {t('editorPage.clearBg')}
              </Button>
            )}
            <input
              ref={bgRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void onBgFile(f)
                e.target.value = ''
              }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-night-600/50 bg-night-800/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-ink-300">{t('editorPage.addPosition')}</span>
            <Button
              variant="ghost"
              className="px-3 py-1 text-xs"
              onClick={() => {
                setDraft((d) => {
                  const next = addPosition(d)
                  setSelectedId(next.positions[next.positions.length - 1].id)
                  return next
                })
                setSaved(false)
              }}
            >
              ＋
            </Button>
          </div>
          {selected ? (
            <PositionInspector
              position={selected}
              onChange={(patch) => patchPos(selected.id, patch)}
              onDelete={() => {
                setDraft((d) => deletePosition(d, selected.id))
                setSelectedId('')
                setSaved(false)
              }}
              canDelete={draft.positions.length > 1}
            />
          ) : (
            <p className="text-xs text-ink-500">{t('editorPage.noSelection')}</p>
          )}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex items-center gap-3">
          <Button onClick={save}>{t('editorPage.save')}</Button>
          {saved && <span className="text-sm text-emerald-300">{t('editorPage.saved')}</span>}
        </div>
        <p className="text-xs text-ink-500">{t('editorPage.selectHint')}</p>
      </aside>
    </div>
  )
}

function DraggablePosition({
  pos,
  spread,
  areaRef,
  selected,
  onSelect,
  onMove,
}: {
  pos: SpreadPosition
  spread: Spread
  areaRef: React.RefObject<HTMLDivElement | null>
  selected: boolean
  onSelect: () => void
  onMove: (x: number, y: number) => void
}) {
  const bind = useDrag(
    ({ movement: [mx, my], first, memo }) => {
      const rect = areaRef.current?.getBoundingClientRect()
      if (!rect) return memo
      const start = first ? { x: pos.x, y: pos.y } : (memo as { x: number; y: number })
      onMove(start.x + mx / rect.width, start.y + my / rect.height)
      return start
    },
    { filterTaps: true, pointer: { touch: true } },
  )

  const style: CSSProperties = {
    position: 'absolute',
    left: `${pos.x * 100}%`,
    top: `${pos.y * 100}%`,
    width: `${spread.card.widthRatio * 100}%`,
    height: `${spread.card.heightRatio * 100}%`,
    transform: `translate(-50%, -50%) rotate(${pos.rotation}deg)`,
    zIndex: pos.z + (selected ? 100 : 0),
    touchAction: 'none',
    cursor: 'grab',
  }

  return (
    <div
      {...bind()}
      style={style}
      onClick={onSelect}
      className={clsx(
        'flex flex-col items-center justify-center rounded-md border p-1 text-center shadow-md transition-colors',
        selected
          ? 'border-mystic-300 bg-mystic-400/30 ring-2 ring-mystic-300'
          : 'border-gold-500/50 bg-night-700/80 hover:border-gold-400',
      )}
    >
      <span className="font-display text-sm text-gold-300">{pos.index}</span>
      <span className="line-clamp-2 text-[10px] leading-tight text-ink-200">{pos.label}</span>
    </div>
  )
}
