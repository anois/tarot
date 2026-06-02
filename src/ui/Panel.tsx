import type { ReactNode } from 'react'
import clsx from 'clsx'

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section
      className={clsx(
        'rounded-2xl border border-night-600/50 bg-night-800/50 p-6 backdrop-blur',
        className,
      )}
    >
      {children}
    </section>
  )
}

export function PageHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-3xl text-gold-300">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-ink-300">{subtitle}</p>}
    </div>
  )
}
