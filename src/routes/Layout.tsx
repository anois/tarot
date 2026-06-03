import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { ErrorBoundary } from '@/ui/ErrorBoundary'
import { useLLMConfig } from '@/store/llmConfig.store'

const NAV = [
  { to: '/', key: 'reading', end: true },
  { to: '/history', key: 'history', end: false },
  { to: '/spreads', key: 'spreads', end: false },
  { to: '/editor', key: 'editor', end: false },
  { to: '/settings', key: 'settings', end: false },
] as const

// Bottom tab bar (mobile): the four primary destinations. The editor is
// reachable from the spreads library, so it is omitted here.
const TABS = [
  { to: '/', key: 'reading', end: true, glyph: '✦' },
  { to: '/history', key: 'history', end: false, glyph: '⟲' },
  { to: '/spreads', key: 'spreads', end: false, glyph: '▦' },
  { to: '/settings', key: 'settings', end: false, glyph: '⚙' },
] as const

export function Layout() {
  const { t } = useTranslation()
  const importedFromShare = useLLMConfig((s) => s.importedFromShare)
  const hasKey = useLLMConfig((s) => !!s.config.apiKey)
  const dismiss = useLLMConfig((s) => s.dismissImportNotice)
  return (
    <div className="relative z-10 mx-auto flex min-h-svh max-w-6xl flex-col px-4">
      <header
        className="flex flex-wrap items-center justify-between gap-4 py-4 md:py-5"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-baseline gap-3">
          <span className="font-display text-[clamp(1.3rem,5vw,1.6rem)] tracking-wide text-gold-300">
            {t('app.title')}
          </span>
          <span className="hidden text-xs text-ink-500 sm:inline">{t('app.tagline')}</span>
        </div>
        {/* desktop pill nav; mobile uses the bottom tab bar */}
        <nav className="hidden gap-1 rounded-full border border-night-600/60 bg-night-800/60 p-1 backdrop-blur md:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                clsx(
                  'rounded-full px-4 py-1.5 text-sm transition-colors',
                  isActive
                    ? 'bg-gold-400 text-night-950 shadow'
                    : 'text-ink-300 hover:text-ink-100',
                )
              }
            >
              {t(`nav.${item.key}`)}
            </NavLink>
          ))}
        </nav>
      </header>
      {importedFromShare && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-gold-500/40 bg-gold-500/10 px-4 py-2 text-sm text-ink-100">
          <span>
            {t('settings.sharedNotice')}
            {hasKey && <span className="ml-1 text-ink-300">{t('settings.sharedNoticeKey')}</span>}
          </span>
          <button onClick={dismiss} className="shrink-0 text-xs text-gold-300 hover:text-ink-100">
            {t('common.dismiss')}
          </button>
        </div>
      )}
      <main className="flex-1 pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:pb-12">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>

      {/* mobile bottom tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-night-600/60 bg-night-900/90 backdrop-blur md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto flex max-w-6xl">
          {TABS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                clsx(
                  'flex min-h-14 flex-1 touch-manipulation flex-col items-center justify-center gap-0.5 text-[11px] transition-colors',
                  isActive ? 'text-gold-300' : 'text-ink-400 hover:text-ink-200',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className={clsx('text-lg leading-none', isActive && 'drop-shadow')}>
                    {item.glyph}
                  </span>
                  <span>{t(`nav.${item.key}`)}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
