import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { Button } from '@/ui/Button'
import { useLLMConfig } from '@/store/llmConfig.store'
import { PRESETS } from '@/llm/presets'
import { createLLMClient } from '@/llm/client'
import { buildShareLink } from '@/llm/shareLink'
import type { LLMProvider, RememberMode } from '@/llm/types'

const REMEMBER_OPTIONS: RememberMode[] = ['none', 'session', 'local']

export function LLMConfigForm() {
  const { t } = useTranslation()
  const config = useLLMConfig((s) => s.config)
  const pingOk = useLLMConfig((s) => s.pingOk)
  const setConfig = useLLMConfig((s) => s.setConfig)
  const setPingOk = useLLMConfig((s) => s.setPingOk)
  const clearKey = useLLMConfig((s) => s.clearKey)

  const [testing, setTesting] = useState(false)
  const [testMsg, setTestMsg] = useState<string | null>(null)
  const [testErr, setTestErr] = useState(false)
  const [includeKey, setIncludeKey] = useState(true)
  const [shareLink, setShareLink] = useState('')
  const [copied, setCopied] = useState(false)

  const preset = PRESETS[config.provider]

  async function generateShare() {
    const link = buildShareLink(config, includeKey)
    setShareLink(link)
    setCopied(false)
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
    } catch {
      /* clipboard blocked — the readonly field below lets the user copy manually */
    }
  }

  function onProvider(provider: LLMProvider) {
    const p = PRESETS[provider]
    setConfig({ provider, baseUrl: p.baseUrl, model: p.defaultModel })
    setTestMsg(null)
  }

  async function test() {
    setTesting(true)
    setTestMsg(null)
    setTestErr(false)
    const client = createLLMClient(config)
    const r = await client.ping()
    setTesting(false)
    if (r.ok) {
      setPingOk(true)
      setTestErr(false)
      setTestMsg(t('settings.testOk'))
    } else {
      setPingOk(false)
      setTestErr(true)
      setTestMsg(r.error?.message ?? '失败')
    }
  }

  const field = 'w-full rounded-lg border border-night-600 bg-night-900/70 p-2 text-sm text-ink-100 outline-none focus:border-mystic-400'

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm text-ink-300">{t('settings.provider')}</label>
        <select
          value={config.provider}
          onChange={(e) => onProvider(e.target.value as LLMProvider)}
          className={field}
        >
          {Object.values(PRESETS).map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-ink-500">{preset.note}</p>
      </div>

      <div>
        <label className="mb-1 block text-sm text-ink-300">{t('settings.baseUrl')}</label>
        <input
          value={config.baseUrl}
          onChange={(e) => setConfig({ baseUrl: e.target.value.trim() })}
          placeholder="https://api.deepseek.com"
          className={field}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-ink-300">{t('settings.model')}</label>
        <input
          value={config.model}
          onChange={(e) => setConfig({ model: e.target.value.trim() })}
          list="model-options"
          className={field}
        />
        <datalist id="model-options">
          {preset.models.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
      </div>

      <div>
        <label className="mb-1 block text-sm text-ink-300">{t('settings.apiKey')}</label>
        <input
          type="password"
          value={config.apiKey}
          onChange={(e) => setConfig({ apiKey: e.target.value.trim() })}
          placeholder="sk-…"
          autoComplete="off"
          className={field}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-ink-300">
          {t('settings.temperature')}：{config.temperature?.toFixed(1)}
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.1}
          value={config.temperature ?? 0.7}
          onChange={(e) => setConfig({ temperature: Number(e.target.value) })}
          className="w-full accent-mystic-400"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-ink-300">{t('settings.remember')}</label>
        <div className="flex flex-col gap-1">
          {REMEMBER_OPTIONS.map((mode) => (
            <label key={mode} className="flex items-center gap-2 text-sm text-ink-300">
              <input
                type="radio"
                name="remember"
                checked={config.remember === mode}
                onChange={() => setConfig({ remember: mode })}
                className="accent-mystic-400"
              />
              {t(`settings.remember${mode.charAt(0).toUpperCase() + mode.slice(1)}`)}
            </label>
          ))}
        </div>
        {config.remember === 'local' && (
          <p className="mt-1 text-xs text-amber-300">⚠ {t('settings.localWarning')}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={test} disabled={testing || !config.apiKey || !config.baseUrl}>
          {testing ? t('settings.testing') : t('settings.test')}
        </Button>
        {config.apiKey && (
          <Button variant="ghost" onClick={clearKey}>
            {t('settings.clearKey')}
          </Button>
        )}
        {pingOk && !testMsg && <span className="text-sm text-emerald-300">{t('settings.testOk')}</span>}
        {testMsg && (
          <span className={clsx('text-sm', testErr ? 'text-red-400' : 'text-emerald-300')}>
            {testMsg}
          </span>
        )}
      </div>

      <p className="rounded-lg border border-night-600/60 bg-night-900/50 p-3 text-xs text-ink-500">
        {t('settings.keyWarning')}
      </p>

      {/* Share-config link */}
      <div className="rounded-lg border border-mystic-400/30 bg-night-900/50 p-3">
        <h3 className="mb-1 font-display text-base text-gold-300">{t('settings.share.title')}</h3>
        <p className="mb-2 text-xs text-ink-400">{t('settings.share.desc')}</p>
        <label className="mb-2 flex items-center gap-2 text-sm text-ink-300">
          <input
            type="checkbox"
            checked={includeKey}
            onChange={(e) => {
              setIncludeKey(e.target.checked)
              setShareLink('')
            }}
            className="accent-mystic-400"
          />
          {t('settings.share.includeKey')}
        </label>
        {includeKey ? (
          <p className="mb-2 text-xs text-amber-300">{t('settings.share.warning')}</p>
        ) : (
          <p className="mb-2 text-xs text-ink-500">{t('settings.share.noKeyHint')}</p>
        )}
        <Button
          variant="secondary"
          onClick={generateShare}
          disabled={!config.baseUrl || (includeKey && !config.apiKey)}
        >
          {t('settings.share.generate')}
        </Button>
        {shareLink && (
          <div className="mt-2">
            {copied && <p className="mb-1 text-sm text-emerald-300">{t('settings.share.copied')}</p>}
            <label className="mb-1 block text-xs text-ink-500">{t('settings.share.linkLabel')}</label>
            <textarea
              readOnly
              value={shareLink}
              onFocus={(e) => e.currentTarget.select()}
              rows={3}
              className="w-full break-all rounded-lg border border-night-600 bg-night-900/70 p-2 text-xs text-ink-200 outline-none"
            />
          </div>
        )}
      </div>
    </div>
  )
}
