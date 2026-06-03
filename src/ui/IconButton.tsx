import type { ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'

type Variant = 'solid' | 'ghost' | 'outline'

const VARIANTS: Record<Variant, string> = {
  solid: 'bg-gold-400 text-night-950 hover:bg-gold-300',
  ghost: 'text-ink-200 hover:text-ink-100 hover:bg-night-700/70',
  outline: 'border border-night-600/70 text-ink-200 hover:bg-night-700/60 hover:text-ink-100',
}

/** Square, ≥44px tap target for glyph actions (close ✕, ◀ ▶, etc.). */
export function IconButton({
  variant = 'ghost',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={clsx(
        'inline-flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-full text-lg leading-none transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  )
}
