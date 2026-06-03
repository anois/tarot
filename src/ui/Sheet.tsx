import { useEffect, useRef, useState, type ReactNode, type PointerEvent } from 'react'
import clsx from 'clsx'
import { IconButton } from './IconButton'

/**
 * Responsive overlay: a drag-to-dismiss bottom sheet on mobile, a right-side
 * drawer on md+. Backdrop click / Esc / the ✕ all close it. Content scrolls
 * with safe-area padding. Used by the controls sheet and the card-detail panel.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  className,
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  footer?: ReactNode
  className?: string
}) {
  const [dragY, setDragY] = useState(0)
  const startY = useRef<number | null>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

  const onHandleDown = (e: PointerEvent) => {
    startY.current = e.clientY
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }
  const onHandleMove = (e: PointerEvent) => {
    if (startY.current == null) return
    setDragY(Math.max(0, e.clientY - startY.current))
  }
  const onHandleUp = () => {
    if (startY.current != null && dragY > 120) onClose()
    startY.current = null
    setDragY(0)
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-center md:justify-end" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-night-950/75 backdrop-blur-sm" onClick={onClose} />
      <aside
        className={clsx(
          'relative mt-auto flex max-h-[88svh] w-full flex-col rounded-t-3xl border border-night-600/60 border-b-0 bg-night-900/95 shadow-2xl',
          'md:mt-0 md:max-h-none md:h-full md:w-[28rem] md:max-w-full md:rounded-3xl md:rounded-r-none md:border-b md:border-r-0',
          className,
        )}
        style={dragY ? { transform: `translateY(${dragY}px)`, transition: 'none' } : undefined}
      >
        {/* mobile grab handle (drag to dismiss) */}
        <div
          className="flex shrink-0 cursor-grab touch-none justify-center pt-3 pb-1 md:hidden"
          onPointerDown={onHandleDown}
          onPointerMove={onHandleMove}
          onPointerUp={onHandleUp}
          onPointerCancel={onHandleUp}
        >
          <span className="h-1.5 w-10 rounded-full bg-night-600" />
        </div>
        <header className="flex shrink-0 items-center justify-between gap-3 px-5 pt-3 pb-2 md:pt-5">
          <h2 className="font-display text-xl text-gold-300">{title}</h2>
          <IconButton onClick={onClose} aria-label="关闭">
            ✕
          </IconButton>
        </header>
        <div className="rule-gold mx-5 shrink-0" />
        <div
          className="min-h-0 flex-1 overflow-y-auto px-5 py-4"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          {children}
        </div>
        {footer && (
          <div
            className="shrink-0 border-t border-night-700/60 px-5 py-3"
            style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
          >
            {footer}
          </div>
        )}
      </aside>
    </div>
  )
}
