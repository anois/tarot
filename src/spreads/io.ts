import type { Spread } from './types'
import { validateSpread, type ValidationResult } from './validate'

/** Pretty-print a spread for export. */
export function spreadToJson(spread: Spread): string {
  return JSON.stringify(spread, null, 2)
}

/** Parse + validate untrusted JSON text. Never uses eval/new Function. */
export function parseSpreadJson(text: string): ValidationResult {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch (e) {
    return {
      ok: false,
      issues: [{ path: '(root)', message: `JSON 解析失败：${(e as Error).message}` }],
    }
  }
  return validateSpread(data)
}

/** Read a user-picked .json file and validate it. */
export async function importSpreadFromFile(file: File): Promise<ValidationResult> {
  const text = await file.text()
  return parseSpreadJson(text)
}

/** Trigger a client-side download of the spread as a portable JSON file. */
export function downloadSpread(spread: Spread): void {
  const blob = new Blob([spreadToJson(spread)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${spread.id}.tarot-spread.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
