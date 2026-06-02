import { useTranslation } from 'react-i18next'

export function Loading() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-ink-300">
      <span className="animate-pulse tracking-widest">{t('common.loading')}</span>
    </div>
  )
}
