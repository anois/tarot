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

export function Layout() {
  const { t } = useTranslation()
  const importedFromShare = useLLMConfig((s) => s.importedFromShare)
  const hasKey = useLLMConfig((s) => !!s.config.apiKey)
  const dismiss = useLLMConfig((s) => s.dismissImportNotice)
  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-4">
      <header className="flex flex-wrap items-center justify-between gap-4 py-5">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-2xl tracking-wide text-gold-300">
            {t('app.title')}
          </span>
          <span className="text-xs text-ink-500">{t('app.tagline')}</span>
        </div>
        <nav className="flex gap-1 rounded-full border border-night-600/60 bg-night-800/60 p-1 backdrop-blur">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                clsx(
                  'rounded-full px-4 py-1.5 text-sm transition-colors',
                  isActive
                    ? 'bg-mystic-400/90 text-night-950 shadow'
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
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-mystic-400/40 bg-mystic-400/10 px-4 py-2 text-sm text-ink-100">
          <span>
            {t('settings.sharedNotice')}
            {hasKey && <span className="ml-1 text-ink-300">{t('settings.sharedNoticeKey')}</span>}
          </span>
          <button onClick={dismiss} className="shrink-0 text-xs text-mystic-200 hover:text-ink-100">
            {t('common.dismiss')}
          </button>
        </div>
      )}
      <main className="flex-1 pb-12">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  )
}
