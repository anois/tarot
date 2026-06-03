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

const GITHUB_URL = 'https://github.com/anois/tarot'

function GitHubMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}

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
        <div className="flex items-center gap-2">
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
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            title="GitHub"
            className="flex h-10 w-10 touch-manipulation items-center justify-center rounded-full text-ink-300 transition-colors hover:bg-night-800/70 hover:text-gold-300"
          >
            <GitHubMark />
          </a>
        </div>
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
