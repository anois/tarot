import { useTranslation } from 'react-i18next'
import { PageHeading, Panel } from '@/ui/Panel'
import { LLMConfigForm } from '@/features/settings/LLMConfigForm'

export default function SettingsRoute() {
  const { t } = useTranslation()
  return (
    <div className="mx-auto max-w-xl">
      <PageHeading title={t('settings.title')} />
      <Panel>
        <LLMConfigForm />
      </Panel>
    </div>
  )
}
