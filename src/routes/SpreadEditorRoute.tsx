import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { PageHeading } from '@/ui/Panel'
import { SpreadEditor } from '@/features/spreads/editor/SpreadEditor'
import type { Spread } from '@/spreads/types'

interface EditorNavState {
  spread?: Spread
  builtinId?: string
}

export default function SpreadEditorRoute() {
  const { t } = useTranslation()
  const location = useLocation()
  const state = location.state as EditorNavState | null

  return (
    <div>
      <PageHeading title={t('nav.editor')} />
      <SpreadEditor
        // Remount when the incoming spread changes so the draft re-initializes.
        key={state?.spread?.id ?? 'blank'}
        initial={state?.spread}
        builtinId={state?.builtinId}
      />
    </div>
  )
}
