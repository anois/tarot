import { Component, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './Button'

interface Props {
  children: ReactNode
  /** Custom fallback; receives a reset callback. */
  fallback?: (reset: () => void, error: Error) => ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  reset = () => this.setState({ error: null })

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback(this.reset, this.state.error)
      return <DefaultFallback onReset={this.reset} />
    }
    return this.props.children
  }
}

function DefaultFallback({ onReset }: { onReset: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-red-500/30 bg-night-800/60 p-6 text-center">
      <h2 className="mb-2 font-display text-xl text-gold-300">{t('common.error')}</h2>
      <p className="mb-4 text-sm text-ink-300">{t('common.errorHint')}</p>
      <Button onClick={onReset}>{t('common.retry')}</Button>
    </div>
  )
}
