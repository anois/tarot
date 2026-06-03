import type { ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-gold-400 text-night-950 hover:bg-gold-300 shadow-[0_2px_18px_-6px_rgba(220,171,68,0.7)]',
  secondary: 'border border-gold-500/60 text-gold-300 hover:bg-gold-500/10',
  ghost: 'text-ink-300 hover:text-ink-100 hover:bg-night-700/60',
}

// md is the ~44px default touch target; sm only for dense desktop clusters.
const SIZES: Record<Size, string> = {
  sm: 'min-h-9 px-3 py-1.5 text-xs',
  md: 'min-h-11 px-4 py-2.5 text-sm',
  lg: 'min-h-12 px-6 py-3 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={clsx(
        'inline-flex touch-manipulation items-center justify-center gap-1.5 rounded-full font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        SIZES[size],
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  )
}
