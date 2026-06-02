import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './routes/Layout'
import { Loading } from './ui/Loading'
import { useLLMConfig } from './store/llmConfig.store'
import { parseSharedConfigFromHash } from './llm/shareLink'

const ReadingRoute = lazy(() => import('./routes/ReadingRoute'))
const HistoryRoute = lazy(() => import('./routes/HistoryRoute'))
const SpreadsRoute = lazy(() => import('./routes/SpreadsRoute'))
const SpreadEditorRoute = lazy(() => import('./routes/SpreadEditorRoute'))
const SettingsRoute = lazy(() => import('./routes/SettingsRoute'))

export function App() {
  // Apply an LLM config carried in a share link (#cfg=…), then strip it from the URL.
  useEffect(() => {
    const shared = parseSharedConfigFromHash(window.location.hash)
    if (shared) {
      useLLMConfig.getState().applyShared(shared)
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }
  }, [])

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Routes>
        <Route element={<Layout />}>
          <Route
            index
            element={
              <Suspense fallback={<Loading />}>
                <ReadingRoute />
              </Suspense>
            }
          />
          <Route
            path="history"
            element={
              <Suspense fallback={<Loading />}>
                <HistoryRoute />
              </Suspense>
            }
          />
          <Route
            path="spreads"
            element={
              <Suspense fallback={<Loading />}>
                <SpreadsRoute />
              </Suspense>
            }
          />
          <Route
            path="editor"
            element={
              <Suspense fallback={<Loading />}>
                <SpreadEditorRoute />
              </Suspense>
            }
          />
          <Route
            path="settings"
            element={
              <Suspense fallback={<Loading />}>
                <SettingsRoute />
              </Suspense>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
