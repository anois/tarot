import clsx from 'clsx'

/** Glass-styled switch with a comfortably tappable (≥44px) label row. */
export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  disabled?: boolean
}) {
  return (
    <label
      className={clsx(
        'flex min-h-11 cursor-pointer touch-manipulation select-none items-center justify-between gap-3 rounded-xl border border-night-600/50 bg-night-800/40 px-3.5',
        disabled && 'cursor-not-allowed opacity-40',
      )}
    >
      <span className="text-sm text-ink-200">{label}</span>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        className={clsx(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          checked ? 'bg-gold-400' : 'bg-night-600',
        )}
      >
        <span
          className={clsx(
            'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-night-950 shadow transition-transform',
            checked && 'translate-x-5',
          )}
        />
      </span>
    </label>
  )
}
